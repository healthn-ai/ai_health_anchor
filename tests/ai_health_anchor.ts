import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { AiHealthAnchor } from "../target/types/ai_health_anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { createAccountsMintsAndTokenAccounts, makeTokenMint } from "@solana-developers/helpers";
import { createAssociatedTokenAccount, createMint, getAccount, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, mintTo, getOrCreateAssociatedTokenAccount, mintToChecked, ASSOCIATED_TOKEN_PROGRAM_ID, createAccount } from "@solana/spl-token"
import fs from "fs";
import { airdropSol, getSolBalance, getTokenBalance, InitBuySol, InitTokenAccount, skipBlockhash, skipBlockhashFinalized, transferSol, transferToken } from "./utils";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;


describe("ai_health_anchor", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.aiHealthAnchor as Program<AiHealthAnchor>;

  const deployer = (provider.wallet as anchor.Wallet).payer;

  const connection = provider.connection;
  let usdt_mint: PublicKey;
  let han_mint: PublicKey;
  let deployer_usdt_account: PublicKey;
  let treasury_usdt_account: PublicKey;
  
  let game_config: PublicKey;
  // let buyer = anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(buyer_path, "utf8"))));
  // const buyer2 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(buyer2_path, "utf8"))));
  let buyer: Keypair;
  let buyer_usdt_account: PublicKey;
  let buyer2: Keypair;
  let buyer2_usdt_account: PublicKey;
  before("before",
    async () => {
      buyer = anchor.web3.Keypair.generate();
      buyer2 = anchor.web3.Keypair.generate();
      await transferSol(connection, deployer, buyer.publicKey, 1000);
      await transferSol(connection, deployer, buyer2.publicKey, 1000);
      
      usdt_mint = await createMint(connection, deployer, deployer.publicKey, null, 6, Keypair.generate(), {skipPreflight: false}, TOKEN_PROGRAM_ID);
      console.info("usdt_mint", usdt_mint);
      // han_mint = await createMint(connection, deployer, deployer.publicKey, null, 6, Keypair.generate(), {skipPreflight: false}, TOKEN_PROGRAM_ID);
      // console.info("han_mint", han_mint);
      // skip a blockhash
      await skipBlockhash(connection, deployer);
      
      deployer_usdt_account = await InitTokenAccount(connection, deployer, deployer.publicKey, usdt_mint);
      console.info("deployer_usdt_account", deployer_usdt_account);
      
      // buyer_usdt_account = await InitTokenAccount(connection, deployer, buyer, usdt_mint);
      // console.info("buyer_usdt_account", buyer_usdt_account);
      
      // buyer2_usdt_account = await InitTokenAccount(connection, deployer, buyer2, usdt_mint);
      // console.info("buyer2_usdt_account", buyer2_usdt_account);
      
      const deployerSolBalance = await getSolBalance(connection, deployer.publicKey);
      console.log(`Deployer ${deployer.publicKey}:  balance: ${deployerSolBalance}`);
      // const buyerSolBalance = await getSolBalance(connection, buyer.publicKey);
      // console.log(`Buyer ${buyer.publicKey}:  balance: ${buyerSolBalance}`);
      
      [treasury_usdt_account] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("treasury_usdt_account"),
        ],
        program.programId
      );
      [game_config] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("game_config"),
        ],
        program.programId
      )
      skipBlockhashFinalized(connection, deployer);
    }
  );

  it("Is initialized!", async () => {
    
    await skipBlockhashFinalized(connection, deployer);
    han_mint = await createMint(connection, deployer, deployer.publicKey, null, 6, Keypair.generate(), {skipPreflight: false}, TOKEN_PROGRAM_ID);
    console.info("han_mint", han_mint);
    const tx = await program.methods
      .initializeConfig()
      .accounts({
        authority: deployer.publicKey,
        usdtMint: usdt_mint,
        hanMint: han_mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([deployer])
      .rpc({commitment: "confirmed"});
      console.log("Your transaction signature", tx);
    // let signature = await connection.confirmTransaction(tx);
    // console.log("Your transaction signature", signature);

  });

  it("start", async () => {
    [game_config] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("game_config"),
      ],
      program.programId
    )
    const tx = await program.methods
      .start()
      .accounts({
        // @ts-expect-error Type error in anchor dependency
        authority: deployer.publicKey,
        gameConfig: game_config,
      }).signers([deployer])
      .rpc({commitment: "confirmed"});
     console.log("Your transaction signature", tx);
  });


  it("Is buy keys!", async () => {
    
    await transferSol(connection, deployer, buyer.publicKey, 1000);
    buyer_usdt_account = await InitTokenAccount(connection, deployer, buyer.publicKey, usdt_mint);
    await skipBlockhash(connection, deployer);
    let user = buyer;
    let buyer_user_account: PublicKey;
    [buyer_user_account] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_account"),
        user.publicKey.toBuffer(),
      ],
      program.programId
    )
    let usdt_token_account = buyer_usdt_account;
    console.info("token_account", usdt_token_account);
    const count = 1;
    const referral_key = null;
    // dynamically build method parameters based on whether there is a referral_key
    const methodBuilder = referral_key
      ? program.methods.buyKey(new BN(count), referral_key)
      : program.methods.buyKey(new BN(count), null);
    

    const tx = await methodBuilder
      .accounts({
        user: user.publicKey,
        usdtMint: usdt_mint,
        // @ts-expect-error Type error in anchor dependency
        userUsdtAccount: usdt_token_account,
        userAccount: buyer_user_account,
        treasuryUsdtAccount: treasury_usdt_account,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log("buy key success!! signature", tx);
    // let user_usdt_account = await createAssociatedTokenAccount(
    //   connection,
    //   buyer,
    //   usdt_mint,
    //   buyer.publicKey,
    //   { skipPreflight: false },
    //   TOKEN_2022_PROGRAM_ID
    // );
    // console.info("user_usdt_account", user_usdt_account);
    // await transferToken(connection, deployer, user_usdt_account, usdt_mint, 100 * 10**6);


    // [user_account] = PublicKey.findProgramAddressSync(
    //   [
    //     Buffer.from("user_account"),
    //     buyer.publicKey.toBuffer(),
    //   ],
    //   program.programId
    // )

    // const buyerUsdtBalance = await getTokenBalance(connection, user_usdt_account);
    // console.log(`Buyer ${buyer.publicKey}:  ${user_usdt_account} USDT balance: ${buyerUsdtBalance}`);

    // // Add your test here.
    // const tx = await program.methods
    //   .buyKey(new BN(1000000), new BN(1))
    //   .accounts({
    //     user: buyer.publicKey,
    //     usdtMint: usdt_mint,
    //     // @ts-expect-error Type error in spl-token dependency
    //     userAccount: user_account,
    //     tokenProgram: TOKEN_PROGRAM,
    //   })
    //   .signers([buyer])
    //   .rpc();
    // console.log("Your transaction signature", tx);
    // let signature = await connection.confirmTransaction(tx);

    // await initBuySol(connection, buyer2, 10);

    // let user_account2: PublicKey;
    // [user_account2] = PublicKey.findProgramAddressSync(
    //   [
    //     Buffer.from("user_account"),
    //     buyer2.publicKey.toBuffer(),
    //   ],
    //   program.programId
    // )
    // const tx2 = await program.methods
    //   .buyKey(new BN(1000000), new BN(1))
    //   .accounts({
    //     user: buyer2.publicKey,
    //     usdtMint: usdt_mint,
    //     // @ts-expect-error Type error in spl-token dependency
    //     userAccount: user_account2,
    //     tokenProgram: TOKEN_PROGRAM,
    //   })
    //   .signers([buyer2])
    //   .rpc();
    // console.log("buyer2 transaction signature", tx2);

    // let signature2 = await connection.confirmTransaction(tx2);


    // let endConfig = await program.account.gameConfig.fetch(game_config, "confirmed");
    // console.log("endConfig", endConfig);
    // const poolUsdtBalance = await getTokenBalance(connection, pool_usdt_account);
    // console.log("poolUsdtBalance:", poolUsdtBalance);
  });

  it("reward", async () => {
    let user = buyer;
    let user_account: PublicKey;
    [user_account] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_account"),
        user.publicKey.toBuffer(),
      ],
      program.programId
    )
    const tx = await program.methods
      .reward(new BN(10000))
      .accounts({
        user: user.publicKey,
        // @ts-expect-error Type error in anchor dependency
        authority: deployer.publicKey,
        userAccount: user_account,
        gameConfig: game_config,
      })
      .signers([deployer])
      .rpc({commitment: "confirmed"});
    console.log("Your transaction signature", tx);

  });



  it("Is claim!", async () => {
    let buyer_account: PublicKey;
    [buyer_account] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_account"),
        buyer.publicKey.toBuffer(),
      ],
      program.programId
    )

    // let user_usdt_account: PublicKey;
    // [user_usdt_account] = PublicKey.findProgramAddressSync(
    //   [
    //     Buffer.from("user_usdt_account"),
    //     buyer.publicKey.toBuffer(),
    //   ],
    //   program.programId
    // )
    // console.log("buyer_account", buyer_account);
    // let beforeUserAccount = await program.account.userAccount.fetch(buyer_account, "confirmed");
    // console.log("user account before claim", beforeUserAccount);

    const tx = await program.methods
      .claim()
      .accounts({
        // user: buyer.publicKey,
        // @ts-expect-error Type error in anchor dependency
        userAccount: buyer_account,
        userUsdtAccount: buyer_usdt_account,
        treasuryUsdtAccount: treasury_usdt_account,
        usdtMint: usdt_mint,
        tokenProgram: TOKEN_PROGRAM,
      })
      .signers([buyer])
      .rpc({commitment: "confirmed"});
      console.log("claim success signature:", tx);

    // let endUserAccount = await program.account.userAccount.fetch(buyer_account, "confirmed");
    // console.log("user account after claim", endUserAccount);
  });
});



