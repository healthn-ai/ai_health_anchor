use anchor_lang::prelude::*;

use crate::state::*;
use crate::error::*;
use crate::constants::*;

pub fn start(ctx: Context<START>) -> Result<()> {
    let game_config = &mut ctx.accounts.game_config;
    if game_config.state != NONSTART_STATE && game_config.state != END_STATE {
        return Err(CustomErrorCode::InvalidState.into());
    }
    let now = Clock::get()?.unix_timestamp;
    game_config.jackpot_pool = game_config.next_round_pool;
    game_config.dividend_pool = 0;
    game_config.next_round_pool = 0;
    game_config.leaderboard_pool = 0;
    game_config.random_reward_pool = 0;
    game_config.total_key_count = 0;
    game_config.total_shadow_count = 0;
    game_config.last_buyer_key = Pubkey::default();
    game_config.current_key_price = INIT_PRICE;
    game_config.state = RUNNING_STATE;
    game_config.round_number = game_config.round_number.checked_add(1).unwrap();
    game_config.end_time = now + MAX_TIMER_SECONDS;
    Ok(())
}

#[derive(Accounts)]
pub struct START<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ CustomErrorCode::InvalidAuthority,
    )]
    pub game_config: Account<'info, GameConfig>,

}