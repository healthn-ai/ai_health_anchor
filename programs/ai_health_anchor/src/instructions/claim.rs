use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked}};

use crate::{error::CustomErrorCode, state::*};

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;

    let claimable_amount = user_account.total_usdt_earned.checked_sub(user_account.total_withdrawn_usdt).unwrap();
    require!(claimable_amount > 0, CustomErrorCode::InsufficientWithdrawAmount);
    let transfer_api_accounts = TransferChecked {
        from: ctx.accounts.treasury_usdt_account.to_account_info(),
        to: ctx.accounts.user_usdt_account.to_account_info(),
        mint: ctx.accounts.usdt_mint.to_account_info(),
        authority: ctx.accounts.treasury_usdt_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let signer_seeds: &[&[&[u8]]] = &[
        &[b"treasury_usdt_account",
        &[ctx.accounts.game_config.treasury_usdt_bump]],
    ];
    let cpi_ctx = CpiContext::new(cpi_program, transfer_api_accounts).with_signer(signer_seeds);
    let decimals = ctx.accounts.usdt_mint.decimals;
    transfer_checked(cpi_ctx, claimable_amount as u64, decimals)?;
    msg!("topic_claim: user:{:?}, usdt_claim_amount: {:?}", ctx.accounts.user.key(), claimable_amount);
    user_account.total_withdrawn_usdt = user_account.total_withdrawn_usdt.checked_add(claimable_amount).unwrap();
    Ok(())
}

pub fn claim_han(ctx: Context<ClaimHan>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let claimable_amount = user_account.total_han_earned.checked_sub(user_account.total_withdrawn_han).unwrap();
    require!(claimable_amount > 0, CustomErrorCode::InsufficientWithdrawAmount);
    let transfer_api_accounts = TransferChecked {
        from: ctx.accounts.treasury_han_account.to_account_info(),
        to: ctx.accounts.user_han_account.to_account_info(),
        mint: ctx.accounts.han_mint.to_account_info(),
        authority: ctx.accounts.treasury_han_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let signer_seeds: &[&[&[u8]]] = &[
        &[b"treasury_han_account",
        &[ctx.accounts.game_config.treasury_han_bump]],
    ];
    let cpi_ctx = CpiContext::new(cpi_program, transfer_api_accounts).with_signer(signer_seeds);
    let decimals = ctx.accounts.han_mint.decimals;
    transfer_checked(cpi_ctx, claimable_amount as u64, decimals)?;
    msg!("topic_claim: user:{:?}, han_claim_amount: {:?}", ctx.accounts.user.key(), claimable_amount);
    user_account.total_withdrawn_han = user_account.total_withdrawn_han.checked_add(claimable_amount).unwrap();
    Ok(())
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"game_config"],
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdt_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_usdt_account: InterfaceAccount<'info, TokenAccount>,

    #[account(constraint = usdt_mint.key() == game_config.usdt_mint_key @ CustomErrorCode::InvalidMint)]
    pub usdt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"treasury_usdt_account"],
        bump = game_config.treasury_usdt_bump,
    )]
    pub treasury_usdt_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}


#[derive(Accounts)]
pub struct ClaimHan<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = han_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_han_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"game_config"],
        bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [b"treasury_han_account"],
        bump,
    )]
    pub treasury_han_account: InterfaceAccount<'info, TokenAccount>,

    #[account(constraint = han_mint.key() == game_config.han_mint_key @ CustomErrorCode::InvalidMint)]
    pub han_mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}   
