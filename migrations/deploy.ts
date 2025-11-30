// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AiHealthAnchor } from "../target/types/ai_health_anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// environment config interface
interface EnvConfig {
  rpcUrl: string;
  usdtMint: string;
  hanMint: string;
  deployerWalletPath: string;
  roundNumber: number;
  cluster?: string;
}

// load environment config from .env directory
function loadEnvConfig(env: string): EnvConfig {
  let config: any;
  
  try {
    switch (env) {
      case "localhost":
      case "localnet":
        config = require("../.env/localhost").LOCALHOST_CONFIG;
        break;
      case "devnet":
      case "dev":
        config = require("../.env/devnet").DEVNET_CONFIG;
        break;
      case "mainnet":
      case "mainnet-beta":
        config = require("../.env/mainnet").MAINNET_CONFIG;
        break;
      default:
        throw new Error(`unknown environment: ${env}`);
    }
    
    // verify config completeness
    if (!config.usdtMint || !config.hanMint || !config.deployerWalletPath) {
      throw new Error(`environment config ${env} is incomplete`);
    }
    
    // verify wallet file exists
    const walletPath = path.resolve(config.deployerWalletPath.replace("~", process.env.HOME || ""));
    if (!fs.existsSync(walletPath)) {
      console.warn(`⚠️  WARNING: wallet file does not exist: ${walletPath}`);
      console.warn(`please ensure the wallet path is correct, or check the wallet configuration in Anchor.toml`);
    }
    
    return {
      ...config,
      cluster: env === "mainnet" ? "mainnet-beta" : env === "devnet" ? "devnet" : undefined,
    };
  } catch (error: any) {
    if (error.code === "MODULE_NOT_FOUND") {
      throw new Error(
        `environment config file not found: .env/${env}.ts\n` +
        `please ensure the config file is created, and contains the corresponding environment configuration.`
      );
    }
    throw error;
  }
}

// get environment type (from environment variable or default value)
function getEnvironment(): string {
  // read from environment variable first
  const env = process.env.ANCHOR_CLUSTER || process.env.SOLANA_CLUSTER || process.env.ENV;
  
  if (env) {
    // standardize environment name
    const normalizedEnv = env.toLowerCase();
    if (normalizedEnv === "localnet" || normalizedEnv === "localhost") {
      return "localhost";
    }
    if (normalizedEnv === "devnet" || normalizedEnv === "dev") {
      return "devnet";
    }
    if (normalizedEnv === "mainnet" || normalizedEnv === "mainnet-beta") {
      return "mainnet";
    }
    return normalizedEnv;
  }
  
  // default to localhost
  return "localhost";
}

module.exports = async function (provider: anchor.AnchorProvider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // get current environment
  const environment = getEnvironment();
  const config = loadEnvConfig(environment);
  
  console.log("==========================================");
  console.log(`🚀 deploy to: ${environment.toUpperCase()}`);
  console.log("==========================================");
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`USDT Mint: ${config.usdtMint}`);
  console.log(`HAN Mint: ${config.hanMint}`);
  console.log(`wallet path: ${config.deployerWalletPath}`);
  console.log(`Authority: ${provider.wallet.publicKey.toString()}`);
  console.log("==========================================");
  
  // verify wallet matches
  const walletPath = path.resolve(config.deployerWalletPath.replace("~", process.env.HOME || ""));
  if (fs.existsSync(walletPath)) {
    try {
      const walletKeypair = anchor.web3.Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf8")))
      );
      if (walletKeypair.publicKey.toString() !== provider.wallet.publicKey.toString()) {
        console.warn(`⚠️  WARNING: current wallet does not match the wallet in the config file`);
        console.warn(`  config wallet: ${walletKeypair.publicKey.toString()}`);
        console.warn(`  current wallet: ${provider.wallet.publicKey.toString()}`);
        console.warn(`  please check the wallet config in Anchor.toml is consistent with the deployerWalletPath in .env/${environment}.ts`);
      }
    } catch (error) {
      console.warn(`⚠️  ERROR: failed to read wallet file: ${error}`);
    }
  }

  // get program instance
  const program = anchor.workspace.ai_health_anchor as Program<AiHealthAnchor>;
  
  // verify program ID
  console.log(`program id: ${program.programId.toString()}`);
  
  // create PublicKey instance
  const usdtMint = new PublicKey(config.usdtMint);
  const hanMint = new PublicKey(config.hanMint);
  
  try {
    // check if account already exists
    const [gameConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_config")],
      program.programId
    );
    
    try {
      const gameConfigAccount = await program.account.gameConfig.fetch(gameConfigPda);
      console.log("⚠️  WARNING: game config already exists, skipping initialization");
      console.log(`game config address: ${gameConfigPda.toString()}`);
      console.log(`current round: ${gameConfigAccount.roundNumber}`);
      console.log(`state: ${gameConfigAccount.state}`);
      return;
    } catch (error) {
      // account does not exist, continue initialization
      console.log("📝 game config does not exist, starting initialization...");
    }
    
    // execute initialization
    console.log("⏳ initializing game config...");
    const tx = await program.methods
      .initializeConfig()
      .accounts({
        authority: provider.wallet.publicKey,
        usdtMint: usdtMint,
        hanMint: hanMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });
    
    console.log("✅ initialization successful!");
    console.log(`transaction signature: ${tx}`);
    console.log(`game config PDA: ${gameConfigPda.toString()}`);
    console.log("==========================================");
    
    // verify initialization result
    const gameConfigAccount = await program.account.gameConfig.fetch(gameConfigPda);
    console.log("📊 game config after initialization:");
    console.log(`  - round: ${gameConfigAccount.roundNumber}`);
    console.log(`  - state: ${gameConfigAccount.state}`);
    console.log(`  - authority: ${gameConfigAccount.authority.toString()}`);
    console.log(`  - USDT Mint: ${gameConfigAccount.usdtMintKey.toString()}`);
    console.log(`  - HAN Mint: ${gameConfigAccount.hanMintKey.toString()}`);
    console.log("==========================================");
    
  } catch (error) {
    console.error("❌ deployment failed:", error);
    throw error;
  }
};
