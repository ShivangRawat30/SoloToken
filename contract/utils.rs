use anchor_lang::{
    prelude::*,
    solana_program::clock::{Clock, UnixTimestamp}
};


use crate::{constants::*};

pub fn get_unix_timstamp() -> UnixTimestamp{
    Clock::get().unwrap().unix_timestamp
}
