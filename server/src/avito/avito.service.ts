import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { AvitoConfig } from './avito.interface';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class AvitoService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private browser: Browser;
  private page: Page;
  private readonly logger = new Logger(AvitoService.name);
  private config: AvitoConfig;

  constructor(
    private configService: ConfigService,
    private gateway: WebsocketGateway,
  ) {
    puppeteer.use(StealthPlugin());
    this.config = {
      login: this.configService.get<string>('AVITO_LOGIN', { infer: true })!,
      password: this.configService.get<string>('AVITO_PASSWORD', {
        infer: true,
      })!,
      targetUser: this.configService.get<string>('AVITO_TARGET_USER', {
        infer: true,
      })!,
      headless:
        this.configService.get<boolean>('PUPPETEER_HEADLESS', {
          infer: true,
        }) === 'true',
      timeout: parseInt(
        this.configService.get<string>('PUPPETEER_TIMEOUT') || '60000',
        10,
      ),
    };
  }

  async onModuleInit() {
    this.logger.log(this.config);
    await this.initializeBrowser();
    await this.login();
    await this.startMonitoring();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  async onApplicationShutdown() {
    await this.cleanup();
  }

  private async initializeBrowser() {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1080, height: 1024 });

    // Логирование ошибок страницы
    this.page.on('error', (err) =>
      this.logger.error(`Page error: ${err.message}`),
    );
    this.page.on('pageerror', (err) =>
      this.logger.error('Page unhandled: ', err),
    );
  }

  private async login() {
    this.logger.log('Начало авторизации на Avito...');

    await this.page.goto('https://www.avito.ru/profile', {
      waitUntil: 'domcontentloaded',
      timeout: this.config.timeout,
    });

    // Ввод логина и пароля
    await this.page
      .locator('input[data-marker="login-form/login/input"]')
      .fill(this.config.login);
    await this.page
      .locator('input[data-marker="login-form/password/input"]')
      .fill(this.config.password);
    await this.page.locator('button[data-marker="login-form/submit"]').click();

    this.logger.log(
      'Введите код из СМС/пуша в открывшемся окне браузера вручную...',
    );

    await this.page.waitForSelector('[data-marker="header/messenger"]');

    this.logger.log('Авторизация успешна');
  }

  private async startMonitoring(): Promise<void> {
    try {
      await this.page.goto(
        `https://www.avito.ru/profile/messenger?q=${this.config.targetUser}`,
      );

      await this.page
        .locator(
          '[data-marker="channels/channel"]:not([class*="support-chat"])',
        )
        .click();

      await this.page.waitForSelector(
        '[class*="message-base-module-left-"] [data-marker="messageText"]',
        { visible: true, timeout: 15000 },
      );

      // Подключаем MutationObserver
      await this.setupMessageObserver();

      // Слушаем события из браузера
      this.page.on('console', (msg) => {
        const text = msg.text();
        if (text.startsWith('__NEW_MESSAGE__::')) {
          const messageText = text.replace('__NEW_MESSAGE__::', '').trim();
          this.handleNewMessage(messageText);
        }
      });

      this.logger.log('Мониторинг сообщений запущен');
    } catch (error) {
      this.logger.error('Ошибка при запуске мониторинга', error);
    }
  }

  private async setupMessageObserver(): Promise<void> {
    await this.page.evaluate(() => {
      const target = document.querySelector('[data-marker="messagesHistory"]');
      if (!target) {
        console.log('__OBSERVER_ERROR__::messagesHistory not found');
        return;
      }

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            const messages = node.querySelectorAll?.(
              '[data-marker="messageText"]',
            );
            messages?.forEach((msgEl) => {
              const text = msgEl.textContent?.trim();
              if (text) {
                console.log('__NEW_MESSAGE__::' + text);
              }
            });
          }
        }
      });

      observer.observe(target, { childList: true, subtree: true });
    });

    this.logger.log('MutationObserver подключен');
  }

  private handleNewMessage(text: string) {
    this.logger.log(`Новое сообщение: ${text}`);

    this.gateway.server.emit('avito', text);

    // 🔄 Здесь можно добавить:
    // - сохранение в БД
    // - бизнес-логику
  }

  private async cleanup(): Promise<void> {
    this.logger.log('Завершение работы AvitoService...');
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Браузер закрыт');
    }
  }
}
