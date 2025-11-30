use anchor_lang::prelude::*;

use crate::{END_STATE, RUNNING_STATE, error::CustomErrorCode, state::*};


pub fn stop(ctx: Context<Stop>) -> Result<()> {
    let game_config = &mut ctx.accounts.game_config;
    // TODO Production env check
    let now = Clock::get()?.unix_timestamp;
    require_eq!(game_config.state, RUNNING_STATE, CustomErrorCode::InvalidState);
    require_gt!(now, game_config.end_time, CustomErrorCode::NotOverEndTime);
   
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
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,
}