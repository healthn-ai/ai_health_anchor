import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction,  Transaction } from "@solana/web3.js"
import { ASSOCIATED_TOKEN_PROGRAM_ID, createMint, createTransferInstruction, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import * as anchor from "@coral-xyz/anchor";

export async function getTokenBalance(
  connection: anchor.web3.Connection,
  tokenAccount: PublicKey
): Promise<number> {
  try {
    const info = await connection.getTokenAccountBalance(tokenAccount);
    if (info.value.uiAmount == null) throw new Error('token balance not found');
    console.log('token balance: ', JSON.stringify(info, null, 2));
    return info.value.uiAmount;
  } catch (error) {
    console.error("getTokenBalance error:", error);
    return 0;
  }
}



export async function InitTokenAccount(connection: Connection, deployer:Keypair, user: PublicKey, mint: PublicKey): Promise<PublicKey> {
  const token_account = await getOrCreateAssociatedTokenAccount(
      connection,
      deployer,
      mint,
      user,
      false,
      "confirmed",
      { skipPreflight: false },
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
  );
  console.info("token_account", token_account);
  let tx = await mintTo(connection, deployer, mint, token_account.address, deployer, 1000000_000000, [], { skipPreflight: false }, TOKEN_PROGRAM_ID);
  console.info("tx", tx);

  return token_account.address;
}



export async function getSolBalance(
  connection: anchor.web3.Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("getSolBalance error:", error);
    return 0;
  }
}

export async function transferSol(
  connection: anchor.web3.Connection,
  from: Keypair,
  to: PublicKey,
  amount: number
): Promise<void> {
  const commitBlockhashWithContext = await connection.getLatestBlockhash();
  let commitTx  = new anchor.web3.Transaction(
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
  const commitTxSignature = await anchor.web3.sendAndConfirmTransaction(connection, commitTx, [from], {skipPreflight: true, commitment: "confirmed"});
  console.log("commitTxSignature", commitTxSignature);
}


export async function airdropSol(
  connection: anchor.web3.Connection,
  to: PublicKey,
  amount: number
): Promise<void> {
  const airdropTransactionSignature = await connection.requestAirdrop(to, amount * LAMPORTS_PER_SOL);
  let signature = await connection.confirmTransaction(airdropTransactionSignature);
  console.log("airdropTransactionSignature", signature);
}

export async function InitBuySol(connection: anchor.web3.Connection, buyer: Keypair, amount: number) {
  await airdropSol(connection, buyer.publicKey, amount);
  const buyerSolBalance = await getSolBalance(connection, buyer.publicKey);
  console.log(`Buyer ${buyer.publicKey} SOL balance: ${buyerSolBalance}`);
}


export async function transferToken(connection: Connection, from: Keypair, to: PublicKey, mint: PublicKey, amount: number): Promise<string> {
    const fromTokenAccount = await getAssociatedTokenAddressSync(
        mint,
        from.publicKey,
    );
    const transaction = new Transaction().add(
        createTransferInstruction(
            fromTokenAccount,
            to,
            from.publicKey,
            amount,
        ),
    );

    return await sendAndConfirmTransaction(connection, transaction, [from]);
}



function findAta(publicKey: PublicKey, mint: PublicKey): PublicKey {
  let ata = getAssociatedTokenAddressSync(
    mint,
    publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  console.log("ata", ata);
  return ata;
}

findAta(new PublicKey("EzSgWjaQ6A7dNKDtjYCuziMXqAs2vvc4f9rhfxM6JsuG"), new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"));


export async function skipBlockhash(connection: anchor.web3.Connection, deployer: Keypair): Promise<void> {
  let blockhash = await connection.getLatestBlockhash();
  let commitTx  = new anchor.web3.Transaction(
    {
      feePayer: deployer.publicKey,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }
  ).add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: deployer.publicKey,
      toPubkey: deployer.publicKey,
      lamports: 1000 * LAMPORTS_PER_SOL,
    })
  );
  let signature = await anchor.web3.sendAndConfirmTransaction(connection, commitTx, [deployer], {skipPreflight: true, commitment: "confirmed"});
}

export async function skipBlockhashFinalized(connection: anchor.web3.Connection, deployer: Keypair): Promise<void> {
  let blockhash = await connection.getLatestBlockhash();
  let commitTx  = new anchor.web3.Transaction(
    {
      feePayer: deployer.publicKey,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }
  ).add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: deployer.publicKey,
      toPubkey: deployer.publicKey,
      lamports: 1000 * LAMPORTS_PER_SOL,
    })
  );
  let signature = await anchor.web3.sendAndConfirmTransaction(connection, commitTx, [deployer], {skipPreflight: true, commitment: "finalized"});
}