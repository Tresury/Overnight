const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Get Tokens on accounts", function () {
  it("User get token", async function () {
    token0Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    token1Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; 
    //USDC - 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    //USDT - 0xdAC17F958D2ee523a2206206994597C13D831ec7
    //wBTC - 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
    //LINK - 0x514910771AF9Ca656af840dff83E8264EcF986CA
    //UNI -0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984

    const token0amount = 1000000000n; // value with decimals
    const token1amount = 1000000000n; // value with decimals
    const width = 2500;
    const poolFee = 500; //0.3%
    const [user1] = await ethers.getSigners(); 
    const positionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; // in mainnet
    const positionManager = await ethers.getContractAt("INonfungiblePositionManager", positionManagerAddress);
    const routerAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // in mainnet
    const uniswapRouter = await ethers.getContractAt("ISwapRouter", routerAddress);
    const liquidityContractFactory = await ethers.getContractFactory("AddLiquidity");
    const liquidityContract = await liquidityContractFactory.deploy(positionManagerAddress);
    const liquidityContractAddress = await liquidityContract.getAddress();
    const uniswapFactory = await ethers.getContractAt("IUniswapV3Factory", "0x1F98431c8aD98523631AE4a59f267346ea31F984");
    poolAddress = await uniswapFactory.getPool(token0Address, token1Address, poolFee);
    const uniswapPool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);   


    const weth = await ethers.getContractAt("IWETH9", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); // in mainnet
    const token0 = await ethers.getContractAt("IERC20", token0Address);
    const token1 = await ethers.getContractAt("IERC20", token1Address);

    // получение токенов на счет пользователя и перевод на контракт
    await weth.deposit({value: 70000000000000000000n});
    await weth.approve(await uniswapRouter.getAddress(), 10000000000000000000n);

    const params = {
      tokenIn: await weth.getAddress(),
      tokenOut: await token0.getAddress(),
      fee: 3000,
      recipient: user1.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, 
      amountOut: token0amount,
      amountInMaximum: 1000000000000000000000000n,
      sqrtPriceLimitX96: 0 
    };

    const params2 = {
      tokenIn: await weth.getAddress(),
      tokenOut: await token1.getAddress(),
      fee: 3000, // Fee tier (0.3% fee for most pairs)
      recipient: user1.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      amountOut: token1amount,
      amountInMaximum: 1000000000000000000000000n, // Set it to some minimum amount to avoid slippage
      sqrtPriceLimitX96: 0 // Not using limit price
    };

    const token0BalaceBefore = await token0.balanceOf(user1.address);
    const token1BalaceBefore = await token1.balanceOf(user1.address);

    await uniswapRouter.exactOutputSingle(params);
    await uniswapRouter.exactOutputSingle(params2);

    expect(await token0.balanceOf(user1.address)).to.equal(token0amount + token0BalaceBefore);
    expect(await token1.balanceOf(user1.address)).to.equal(token1amount + token1BalaceBefore);

    await weth.transfer(liquidityContractAddress, await weth.balanceOf(user1.address));
    await token0.transfer(liquidityContractAddress, token0amount);
    await token1.transfer(liquidityContractAddress, token1amount);

    expect(await token0.balanceOf(liquidityContractAddress)).to.equal(token0amount);
    expect(await token1.balanceOf(liquidityContractAddress)).to.equal(token1amount);

    const token0PoolBalaceBefore = await token0.balanceOf(poolAddress);
    const token1PoolBalaceBefore = await token1.balanceOf(poolAddress);

    await liquidityContract.addLiquidity(
        poolAddress, 
        token0amount, 
        token1amount, 
        width
      );

    expect(await token0.balanceOf(poolAddress)).to.equal(token0amount + token0PoolBalaceBefore - await token0.balanceOf(liquidityContractAddress));
    expect(await token1.balanceOf(poolAddress)).to.equal(token1amount + token1PoolBalaceBefore - await token1.balanceOf(liquidityContractAddress));
    console.log("liquidity was added Token0:", await token0.balanceOf(poolAddress) - token0PoolBalaceBefore);
    console.log("liquidity was added Token1:", await token1.balanceOf(poolAddress) - token1PoolBalaceBefore);

    const[,,token0check, token1check, , tickLowerCheck, tickUpperCheck] = await positionManager.positions(await liquidityContract.tokenId());
    expect([token0check, token1check].sort()).to.deep.equal([token0Address, token1Address].sort());

    lowerPrice = 1.0001 ** tickLowerCheck.toString();
    upperPrice = 1.0001 ** tickUpperCheck.toString();
    console.log("width:", (upperPrice-lowerPrice)/(upperPrice+lowerPrice) * 10000, width);
    console.log("Price range:", 1.0001 ** tickLowerCheck.toString(), 1.0001 ** tickUpperCheck.toString());
    expect(Math.round((upperPrice-lowerPrice)/(upperPrice+lowerPrice) * 10000/10)*10).to.equal(width);
  }
  )
});
