# Put liquidity in UniswapV3Pool
## Тех.задание

Необходимо написать контракт, который взаимодействует с протоколом UniswapV3.
В контракт подается информация о интересующем пуле (адрес пула), количество первого и второго актива, который необходимо вложить в позицию, а также параметр ширины.
Необходимо вложить заданные объемы в позицию таким образом, чтобы ширина этой позиции равнялась заданному параметру.
Ширину предлагаем считать следующим образом: width = (upperPrice - lowerPrice) * 10000 / (lowerPrice + upperPrice).
Необходимо, чтобы контракт работал для любого uniswap v3 пула вне зависимости от вкладываемых токенов.

Задача должна быть решена полностью ончейн (нет никаких расчетов не на контракте) и покрыта необходимыми тестами.

## Решение

Писал и тестировал проект через Hardhat на форке ETH mainnet (подробнее см. hardhat.config.js)

1. Запустить ноду Infura.

   Вызвать в терминале команду npx hardhat node --fork https://mainnet.infura.io/v3/xxxxxxxxxxxxx (вместо xxxxxxxxxxxxx свой пароль Infura)

   Аналогично заменить пароль в файле hardhat.config.js
3. npx hardhat test - скомпилирует смарт-контракт и запустит тест
4. в файле AddLiquidity.js адрес пула подбирается оффчейн в зависимости от токенов для ликвидности
