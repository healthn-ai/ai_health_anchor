use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use anchor_spl::associated_token::AssociatedToken;

use crate::{state::*};





pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
    let game_config = &mut ctx.accounts.game_config;
    
    game_config.round_number = 0;
    game_config.state = 0;
    game_config.authority = ctx.accounts.authority.key();
    game_config.treasury_usdt_bump = ctx.bumps.treasury_usdt_account;
    game_config.treasury_han_bump = ctx.bumps.treasury_han_account;
    game_config.usdt_mint_key = ctx.accounts.usdt_mint.key();
    game_config.han_mint_key = ctx.accounts.han_mint.key();
    game_config.bump = ctx.bumps.game_config;
    msg!("Game initialized with program id: {:?}", ctx.program_id);
    Ok(())
}




#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + GameConfig::INIT_SPACE,
        seeds = [b"game_config"],
        bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        init,
        payer = authority,
        token::mint = usdt_mint,
        token::authority = treasury_usdt_account,
        seeds = [b"treasury_usdt_account"],
        bump,
    )]
    pub treasury_usdt_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = han_mint,
        token::authority = treasury_han_account,
        seeds = [b"treasury_han_account"],
        bump,
    )]
    pub treasury_han_account: InterfaceAccount<'info, TokenAccount>,
    
    pub usdt_mint: InterfaceAccount<'info, Mint>,

    pub han_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}