use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked};

use crate::state::*;
use crate::constants::*;
use crate::error::*;

pub fn buy_key(ctx: Context<BuyKey>, count: u64, referral_key: Option<Pubkey>) -> Result<()> {
    let game_config = &mut ctx.accounts.game_config;

    require_eq!(game_config.state, RUNNING_STATE, CustomErrorCode::InvalidState);

    let price = game_config.current_key_price;
    let pay_amount = count.checked_mul(price).unwrap();
    let now = Clock::get()?.unix_timestamp;
    if  now > game_config.end_time {
        return Err(CustomErrorCode::OverEndTime.into());
    }
   
    let max_end_time = now + MAX_TIMER_SECONDS;
    let expect_end_time = game_config.end_time + TIMER_BONUS_SECONDS;
    game_config.end_time = if expect_end_time > max_end_time { max_end_time } else { expect_end_time };
    game_config.current_key_price = game_config.current_key_price.checked_add(PRICE_INCREMENT).unwrap();
    game_config.total_key_count = game_config.total_key_count.checked_add(count).unwrap();
    game_config.last_buyer_key = ctx.accounts.user.key();
    
    let left_time = game_config.end_time.checked_sub(now).unwrap();
    msg!("topic_buy_key: user:{:?}, pay_amount:{:?}, count:{:?}, current_key_price:{:?}, referral_key:{:?}, time_stamp:{:?}, round_number:{:?}, left_time:{:?}", 
    ctx.accounts.user.key(), pay_amount, count, game_config.current_key_price, referral_key.unwrap_or_default(), now, game_config.round_number, left_time);
 
    let jackpot_amount = pay_amount.checked_mul(45).unwrap() / 100;
    let dividend_amount = pay_amount.checked_mul(25).unwrap() / 100;
    let next_seed_amount = pay_amount.checked_mul(17).unwrap() / 100;
    let han_logic_amount = pay_amount.checked_mul(12).unwrap() / 100; // Funds allocated to HAN-related logic
    let random_reward_amount = pay_amount.checked_mul(1).unwrap() / 100;
    msg!("topic_buy_key: jackpot_amount: {:?}, dividend_amount: {:?}, next_seed_amount: {:?}, leaderboard_amount: {:?}, random_reward_amount: {:?}", jackpot_amount, dividend_amount, next_seed_amount, han_logic_amount, random_reward_amount);
    // let treasury_account = &mut ctx.accounts.treasury_account;
    game_config.jackpot_pool = game_config.jackpot_pool.checked_add(jackpot_amount).unwrap();
    game_config.dividend_pool = game_config.dividend_pool.checked_add(dividend_amount).unwrap();
    game_config.next_round_pool = game_config.next_round_pool.checked_add(next_seed_amount).unwrap();
    game_config.leaderboard_pool = game_config.leaderboard_pool.checked_add(han_logic_amount).unwrap();
    game_config.random_reward_pool = game_config.random_reward_pool.checked_add(random_reward_amount).unwrap();

    if referral_key.is_some() {
        game_config.total_shadow_count = game_config.total_shadow_count.checked_add(count).unwrap();
    }

    let user_account = &mut ctx.accounts.user_account;
    user_account.key_count = user_account.key_count.checked_add(count).unwrap();
    user_account.total_usdt_spent = user_account.total_usdt_spent.checked_add(pay_amount).unwrap();
    user_account.last_key_purchase_time = now;
    user_account.bump = ctx.bumps.user_account;

    let transfer_api_accounts = TransferChecked {
        from: ctx.accounts.user_usdt_account.to_account_info(),
        to: ctx.accounts.treasury_usdt_account.to_account_info(),
        mint: ctx.accounts.usdt_mint.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, transfer_api_accounts);
    transfer_checked(cpi_ctx, pay_amount, ctx.accounts.usdt_mint.decimals)?;

    Ok(())
}


#[derive(Accounts)]
#[instruction(round_number: u64)]
pub struct BuyKey<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_config"], 
        bump
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR + UserAccount::INIT_SPACE,
        seeds = [b"user_account", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_usdt_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_usdt_account: InterfaceAccount<'info, TokenAccount>,

    pub usdt_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,

}
