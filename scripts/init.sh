#!/bin/sh

(cd server && npm i) || { echo "Ошибка при установке зависимостей в server/"; exit 1; }
(cd client && npm i) || { echo "Ошибка при установке зависимостей в client/"; exit 1; }

echo "Зависимости успешно установлены в server/ и client/"
