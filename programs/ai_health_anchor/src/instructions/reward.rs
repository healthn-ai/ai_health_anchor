use anchor_lang::prelude::*;

use crate::{error::CustomErrorCode, state::*};

pub fn reward(ctx: Context<Reward>, usdt_amount: u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.total_usdt_earned = usdt_amount;
    Ok(())
}

pub fn reward_han(ctx: Context<RewardHan>, han_amount: u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.total_han_earned = han_amount;
    Ok(())
}

#[derive(Accounts)]
pub struct Reward<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub user: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"game_config"],
        bump = game_config.bump,
        has_one = authority @ CustomErrorCode::InvalidOwner,
    )]
    pub game_config: Account<'info, GameConfig>,

    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct RewardHan<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub user: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"game_config"],
        has_one = authority @ CustomErrorCode::InvalidOwner,
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    pub system_program: Program<'info, System>,
}