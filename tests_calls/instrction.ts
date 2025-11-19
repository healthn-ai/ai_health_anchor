import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, tokenMetadataInitialize } from "@solana/spl-token"
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { transferToken } from "../tests/utils";
import { LoadConfig, init, initUsers } from "./common";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;


const { usdt_mint, han_mint } = LoadConfig();


const { deployer, buyer } = initUsers();
// set Anchor provider and workspace
const { connection, program } = init();



export async function transferSol(
  connection: anchor.web3.Connection,
  from: Keypair,
  to: PublicKey,
  amount: number
): Promise<void> {
  const commitBlockhashWithContext = await connection.getLatestBlockhash();
  let commitTx = new anchor.web3.Transaction(
    {
      feePayer: from.publicKey,
      blockhash: commitBlockhashWithContext.blockhash,
      lastValidBlockHeight: commitBlockhashWithContext.lastValidBlockHeight,
    }
  ).add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  const commitTxSignature = await anchor.web3.sendAndConfirmTransaction(connection, commitTx, [from], { skipPreflight: true, commitment: "confirmed" });
  console.log("commitTxSignature", commitTxSignature);
}



async function createMintToken() {
  const usdt_mint = await createMint(connection, deployer, deployer.publicKey, null, 6, Keypair.generate(), { skipPreflight: true });
  console.info("usdt_mint", usdt_mint);
  const han_mint = await createMint(connection, deployer, deployer.publicKey, null, 6, Keypair.generate(), { skipPreflight: true });
  console.info("han_mint", han_mint);
}

async function InitTokenAccount(user: Keypair, mint: PublicKey) {
  const token_account = await getOrCreateAssociatedTokenAccount(
    connection,
    deployer,
    mint,
    user.publicKey,
    false,
    "confirmed",
    { skipPreflight: false },
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  console.info("token_account", token_account);
  let tx = await mintTo(connection, deployer, mint, token_account.address, deployer, 1000000_000000, [], { skipPreflight: false }, TOKEN_PROGRAM_ID);
  console.info("tx", tx);
}



async function InitGameConfig() {
  const tx = await program.methods
    .initializeConfig()
    .accounts({
      authority: deployer.publicKey,
      usdtMint: usdt_mint,
      hanMint: han_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([deployer])
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);
}

async function start() {
  let game_config: PublicKey;
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
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);
}



async function buyKey(user: Keypair, count: number, referral_key?: PublicKey | null) {
  let buyer_user_account: PublicKey;
  [buyer_user_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_account"),
      user.publicKey.toBuffer(),
    ],
    program.programId
  )
  let treasury_usdt_account: PublicKey;
  [treasury_usdt_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("treasury_usdt_account"),
    ],
    program.programId
  );

  let usdt_token_account = getAssociatedTokenAddressSync(
    usdt_mint,
    user.publicKey,
    false,
    TOKEN_PROGRAM_ID
  )
  console.info("token_account", usdt_token_account);

  // build method parameters dynamically based on whether there is a referral_key
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
    .rpc({ commitment: "confirmed" });

  console.log("Your transaction signature", tx);

}

async function reward(user: Keypair, amount: number) {
  let game_config: PublicKey;
  [game_config] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("game_config"),
    ],
    program.programId
  )
  let user_account: PublicKey;
  [user_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_account"),
      user.publicKey.toBuffer(),
    ],
    program.programId
  )

  const tx = await program.methods
    .reward(new BN(amount))
    .accounts({
      user: user.publicKey,
      // @ts-expect-error Type error in anchor dependency
      authority: deployer.publicKey,
      userAccount: user_account,
      gameConfig: game_config,
    })
    .signers([deployer])
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);
}

async function rewardHan(user: Keypair, amount: number) {
  let user_account: PublicKey;
  [user_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_account"),
      user.publicKey.toBuffer(),
    ],
    program.programId
  )
  let game_config: PublicKey;
  [game_config] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("game_config"),
    ],
    program.programId
  )
  const tx = await program.methods
    .rewardHan(new BN(amount))
    .accounts({
      user: user.publicKey,
      // @ts-expect-error Type error in anchor dependency
      authority: deployer.publicKey,
      userAccount: user_account,
      gameConfig: game_config,
    })
    .signers([deployer])
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);
}

async function claim(user: Keypair) {
  let user_account: PublicKey;
  [user_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_account"),
      user.publicKey.toBuffer(),
    ],
    program.programId
  )
  let treasury_usdt_account: PublicKey;
  [treasury_usdt_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("treasury_usdt_account"),
    ],
    program.programId
  )
  let usdt_token_account = getAssociatedTokenAddressSync(
    usdt_mint,
    user.publicKey,
    false,
    TOKEN_PROGRAM_ID
  )
  const tx = await program.methods
    .claim()
    .accounts({
      user: user.publicKey,
      // @ts-expect-error Type error in anchor dependency
      userAccount: user_account,
      userUsdtAccount: usdt_token_account,
      treasuryUsdtAccount: treasury_usdt_account,
      usdtMint: usdt_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user])
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);
}

// async function closeUserAccount(user: Keypair) {
//   let user_account: PublicKey;
//   [user_account] = PublicKey.findProgramAddressSync(
//     [
//       Buffer.from("user_account"),
//       user.publicKey.toBuffer(),
//     ],
//     program.programId
//   )
//   const tx = await program.methods
//   .closeUserAccount()
//   .accounts({
//     user: deployer.publicKey,
//     // @ts-expect-error Type error in anchor dependency
//     userAccount: user_account,
//   })
//   .signers([deployer])
//   .rpc({commitment: "confirmed"});
//   console.log("Your transaction signature", tx);
// }

async function claimHan(user: Keypair) {
  let user_account: PublicKey;
  [user_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_account"),
      user.publicKey.toBuffer(),
    ],
    program.programId
  )
  let treasury_han_account: PublicKey;
  [treasury_han_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("treasury_han_account"),
    ],
    program.programId
  )
  let han_token_account = getAssociatedTokenAddressSync(
    han_mint,
    user.publicKey,
    false,
    TOKEN_PROGRAM_ID
  )

  const tx = await program.methods
    .claimHan()
    .accounts({
      user: user.publicKey,
      // @ts-expect-error Type error in anchor dependency
      userAccount: user_account,
      userHanAccount: han_token_account,
      treasuryHanAccount: treasury_han_account,
      hanMint: han_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user])
    .rpc({ commitment: "confirmed" });

  console.log("Your transaction signature", tx);
}

async function stop() {
  const tx = await program.methods
    .stop()
    .accounts({
      authority: deployer.publicKey,
    }).signers([deployer])
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);
}

async function transferHan(amount: number) {
  let treasury_han_account: PublicKey;
  [treasury_han_account] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("treasury_han_account"),
    ],
    program.programId
  )
  let signature = await transferToken(connection, deployer, treasury_han_account, han_mint, amount)
  console.info("signature", signature);
}


async function createUserAccount(user: Keypair) {
  const tx = await program.methods
    .createUserAccount()
    .accounts({
      user: user.publicKey,
    })
    .signers([user])
    .rpc({ commitment: "confirmed" });
  console.log("Your transaction signature", tx);

}



async function preAllToken() {
  await InitTokenAccount(deployer, usdt_mint)
  await InitTokenAccount(buyer, usdt_mint)
  await InitTokenAccount(deployer, han_mint)
  // await InitTokenAccount(buyer, han_mint)
  await transferSol(connection, deployer, buyer.publicKey, 100)
}



// createMintToken()
// change mint address to usdt address

// preAllToken()
InitGameConfig()
// start()
// buyKey(deployer, 5, buyer.publicKey)
// buyKey(deployer, 10)
// buyKey(buyer, 5)
// buyKey(buyer, 2, deployer.publicKey)
// reward(buyer, 1_00000)
// claim(buyer)
// transferHan(100000_000000)

// createUserAccount(deployer)

// rewardHan(buyer, 2_000000)
// claimHan(buyer)
// stop()
// claim(buyer)

// closeUserAccount(buyer);