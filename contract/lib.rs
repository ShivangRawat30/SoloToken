mod constants;
mod utils;
mod error;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
use anchor_lang::{
    prelude::*,
    system_program,
    solana_program::{clock::{Clock, UnixTimestamp}, hash::hash, program::invoke, system_instruction::transfer},
};
use crate::{constants::*, utils::*, error::*};
declare_id!("3UJvN3nzxEf2oDbYPVXwse2rPpzVXKBunaLf8hbqrFga");

#[program]
mod time_game_dapp {
    use super::*;

        pub fn init_master(ctx: Context<InitMaster>) -> Result<()> {
            let master = &mut ctx.accounts.master;
            master.authority = ctx.accounts.payer.key();

            Ok(())
        }

        pub fn create_lottery(ctx: Context<CreateLottery>) -> Result<()> {
            let master = &mut ctx.accounts.master;
            let lottery = &mut ctx.accounts.lottery;
            // Increase the last id on each bet creation on the master
            master.last_id += 1;

            // Setting lottery values
            lottery.id = master.last_id;
            lottery.authority = ctx.accounts.authority.key();
            lottery.started = false;
            lottery.ticket_amount = 100000000;

            msg!("Created lottery: {}", lottery.id);
            msg!("Authority: {}", lottery.authority);
            msg!("Game Started: {}", lottery.started);

            Ok(())
        }

        pub fn buy_ticket(ctx: Context<BuyTicket>, lottery_id: u32) -> Result<()> {
            let lottery = &mut ctx.accounts.lottery;
            let ticket = &mut ctx.accounts.ticket;
            let master = &mut ctx.accounts.master;
            let buyer = &ctx.accounts.buyer;
            let owner = &ctx.accounts.owner;

            if lottery.winner_id.is_some() {
                return err!(LotteryError::WinnerAlreadyExists);
            }

            lottery.last_ticket_id += 1;


            // ticket struct
            ticket.id = lottery.last_ticket_id;
            ticket.lottery_id = lottery_id;
            ticket.authority = buyer.key();
            ticket.ticket_purchased += 1;

            master.total_volume += lottery.ticket_amount;
            master.total_players += 1;

             //lottery struct
            lottery.total_amount += lottery.ticket_amount;
            let thirty_min = 2*60;// changed
            let window = get_unix_timstamp() + thirty_min as i64;
            lottery.window_time = Some(window);
            let curr = get_unix_timstamp() as i64;
            lottery.start_time = Some(curr);
            lottery.total_tickets += 1;

            if lottery.started == false {
                lottery.started = true;
                let two_weeks = 60; // changed
                let last_date = get_unix_timstamp() + two_weeks as i64;
                lottery.last_time = Some(last_date);
            }


        // Transfer SOL to the author of the smart contract.
            system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer{
                from: ctx.accounts.buyer.to_account_info(),
                to: owner.to_account_info(),
                },
            ),
        lottery.ticket_amount,
        );

        lottery.last_bought_id = ticket.id;

        Ok(())
    }

    pub fn buy_more_ticket(ctx:Context<BuyMoreTickets>, _lottery_id: u32, _ticket_id: u32) -> Result<()> {
            let lottery = &mut ctx.accounts.lottery;
            let ticket = &mut ctx.accounts.ticket;
            let master = &mut ctx.accounts.master;
            let buyer = &ctx.accounts.buyer;
            let owner = &ctx.accounts.owner;

            if lottery.winner_id.is_some() {
                return err!(LotteryError::WinnerAlreadyExists);
            }

            ticket.ticket_purchased += 1;
            lottery.total_tickets += 1;

            master.total_volume += lottery.ticket_amount;

             //lottery struct
            lottery.total_amount += lottery.ticket_amount;
            let thirty_min = 2*60;// changed
            let window = get_unix_timstamp() + thirty_min as i64;
            lottery.window_time = Some(window);

            if lottery.started == false {
                lottery.started = true;
                let two_weeks = 14*24*3600;
                let last_date = get_unix_timstamp() + two_weeks as i64;
                lottery.last_time = Some(last_date);
            }


        // Transfer SOL to the author of the smart contract.
            system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer{
                from: ctx.accounts.buyer.to_account_info(),
                to: owner.to_account_info(),
                },
            ),
        lottery.ticket_amount,
        );

        lottery.last_bought_id = ticket.id;

        Ok(())
    }
    pub fn pick_winner(ctx:Context<PickWinner>, lottery_id: u32) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;

        if lottery.winner_id.is_some() {
            return err!(LotteryError::WinnerAlreadyExists);
        }

        if lottery.last_ticket_id == 0 {
            return err!(LotteryError::NoTickets);
        }

        let current_time = get_unix_timstamp();
        let val = 4294967295 as u32;
        if lottery.window_time <= Some(current_time) {
            lottery.winner_id = Some(lottery.last_bought_id);
        }
        else if lottery.last_time <= Some(current_time) {
            lottery.winner_id = Some(val);
        }
        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>, _lottery_id:u32) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        let winner = &mut ctx.accounts.winner;
        let owner = &mut ctx.accounts.authority;
        
        if lottery.claimed {
            return err!(LotteryError::AlreadyClaimed);
        }

        let prize = lottery.total_amount * 0.95 as u64;
       system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer{
                from: owner.to_account_info(),
                to: winner.to_account_info(),
                },
            ),
        prize,
        );
        lottery.claimed = true;

        Ok(())

    }

}



#[derive(Accounts)]
pub struct InitMaster<'info> {
    #[account(
        init,
        payer = payer,
        space = 4+8+8+8+32,
        seeds = [MASTER_SEED.as_bytes()],
        bump,
    )]
    pub master: Account<'info, Master>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Master{
    pub last_id: u32,
    pub total_players: u64,
    pub authority: Pubkey,
    pub total_volume: u64,
}

#[derive(Accounts)]
pub struct CreateLottery<'info> {
    #[account(
        init,
        payer = authority,
        space = 8+4+32+4+8+4+1+1+8+8+8+32+4+8,
        seeds = [LOTTERY_SEED.as_bytes(), &(master.last_id + 1).to_le_bytes()],
        bump,
    )]
    pub lottery: Account<'info, Lottery>,
    #[account(
        mut,
        seeds = [MASTER_SEED.as_bytes()],
        bump,
    )]
    pub master: Account<'info, Master>,
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Lottery{
    pub id: u32,
    pub authority: Pubkey,
    pub last_ticket_id: u32,
    pub ticket_amount: u64,
    pub total_amount: u64,
    pub last_bought_id: u32,
    pub winner_id: Option<u32>,
    pub total_tickets: i32,
    pub claimed: bool,
    pub started: bool,
    pub start_time: Option<i64>,
    pub window_time: Option<i64>,
    pub last_time: Option<i64>,
}

#[derive(Accounts)]
#[instruction(lottery_id: u32)]
pub struct BuyTicket<'info> {
    #[account(
        mut,
        seeds = [LOTTERY_SEED.as_bytes(), &lottery_id.to_le_bytes()],
        bump,
    )]
    pub lottery: Account<'info, Lottery>,

    #[account(
        init,
        payer = buyer,
        space = 8+4+4+32+8+8+1,
        seeds = [
            TICKET_SEED.as_bytes(),
            lottery.key().as_ref(),
            &(lottery.last_ticket_id + 1).to_le_bytes()
        ],
        bump,
    )]
    pub ticket: Account<'info, Ticket>,
        #[account(
        mut,
        seeds = [MASTER_SEED.as_bytes()],
        bump,
    )]
    pub master: Account<'info, Master>,

    #[account(
        mut
    )]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Ticket{
    pub id: u32,
    pub lottery_id: u32,
    pub authority: Pubkey,
    pub ticket_purchased: u32,
    pub token_claimed: bool,
}

#[derive(Accounts)]
#[instruction(lottery_id: u32, ticket_id: u32)]
pub struct BuyMoreTickets<'info> {
    #[account(
        mut,
        seeds = [LOTTERY_SEED.as_bytes(), &lottery_id.to_le_bytes()],
        bump,
    )]
    pub lottery: Account<'info, Lottery>,

    #[account(
        mut,
        seeds = [
            TICKET_SEED.as_bytes(),
            &lottery.key().as_ref(),
            &ticket_id.to_le_bytes()
        ],
        bump,
    )]
    pub ticket: Account<'info, Ticket>,
        #[account(
        mut,
        seeds = [MASTER_SEED.as_bytes()],
        bump,
    )]
    pub master: Account<'info, Master>,

    #[account(
        mut
    )]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
#[instruction(lottery_id:u32)]
pub struct PickWinner<'info> {
    #[account(
        mut,
        seeds = [LOTTERY_SEED.as_bytes(), &lottery_id.to_le_bytes()],
        bump,
    )]
    pub lottery: Account<'info, Lottery>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(lottery_id: u32)]
pub struct ClaimPrize<'info> {
    #[account(
        mut,
        seeds = [LOTTERY_SEED.as_bytes(), &lottery_id.to_le_bytes()],
        bump,
    )]
    pub lottery: Account<'info, Lottery>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub winner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}