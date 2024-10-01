// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./lib/TickMath.sol";
import "./lib/ABDKMath64x64.sol";

contract AddLiquidity {
    using SafeERC20 for IERC20;
    INonfungiblePositionManager public positionManager;
    uint256 public tokenId;

    constructor(address _positionManager) {
        positionManager = INonfungiblePositionManager(_positionManager);
    }

    function addLiquidity(address pool, uint256 amount0, uint256 amount1, uint256 width) public {
        IUniswapV3Pool uniswapPool = IUniswapV3Pool(pool);

        IERC20(uniswapPool.token0()).forceApprove(address(positionManager), amount0);
        IERC20(uniswapPool.token1()).forceApprove(address(positionManager), amount1);

        (uint160 sqrtPriceX96, int24 tick, , , , , ) = uniswapPool.slot0();
        int24 tickSpacing = uniswapPool.tickSpacing();

        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: uniswapPool.token0(),
                token1: uniswapPool.token1(),
                fee: uniswapPool.fee(),
                tickLower: nearestUsableTick(getLowerTick(sqrtPriceX96, width), tickSpacing),
                tickUpper: nearestUsableTick(getUpperTick(sqrtPriceX96, width), tickSpacing),
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            });
        (tokenId, , , ) = positionManager.mint(params);
    }

    function getLowerTick(uint160 sqrtPriceX96, uint256 width) public view returns(int24) {
        int24 lowerTick = TickMath.getTickAtSqrtRatio(uint160((sqrtPriceX96 * sqrt((10000 - width)*10000)) / 10000));
        return(lowerTick);
    }

    function getUpperTick(uint160 sqrtPriceX96, uint256 width) public view returns(int24) {
        int24 upperTick = TickMath.getTickAtSqrtRatio(uint160((sqrtPriceX96 * sqrt((10000 + width)*10000)) / 10000));
        return(upperTick);
    }

    function getSqrtPrice(int24 tick) public view returns(uint160) {
        return(TickMath.getSqrtRatioAtTick(tick));
    }

    function getPrice(uint160 sqrtPrice) public view returns(uint256) {
        return(uint256(sqrtPrice) * uint256(sqrtPrice) / (1 << 192));
    }

    function sqrt(uint y) public pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function nearestUsableTick(int24 tick_, int24 tickSpacing) public pure returns (int24 result) {
        result = int24(divRound(int128(tick_), int128(int24(tickSpacing)))) * int24(tickSpacing);
        if (result < TickMath.MIN_TICK) {
            result += int24(tickSpacing);
        } else if (result > TickMath.MAX_TICK) {
            result -= int24(tickSpacing);
        }
    }

    function divRound(int128 x, int128 y) internal pure returns (int128 result) {
        int128 quot = ABDKMath64x64.div(x, y);
        result = quot >> 64;
    // Check if remainder is greater than 0.5
        if (quot % 2**64 >= 0x8000000000000000) {
            result += 1;
        }
    }
}
