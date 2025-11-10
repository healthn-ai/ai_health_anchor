use anchor_lang::prelude::*;

use crate::{error::CustomErrorCode, state::*, END_STATE};


pub fn stop(ctx: Context<Stop>) -> Result<()> {
    let game_config = &mut ctx.accounts.game_config;
    // TODO Production env check
    let now = Clock::get()?.unix_timestamp;
    if now < game_config.end_time {
        return Err(CustomErrorCode::NotOverEndTime.into());
    }
    game_config.state = END_STATE;
    
    Ok(())
}

#[derive(Accounts)]
pub struct Stop<'info> {
    
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_config"],
        has_one = authority @ CustomErrorCode::InvalidAuthority,
        bump,
    )]
    pub game_config: Account<'info, GameConfig>,
}