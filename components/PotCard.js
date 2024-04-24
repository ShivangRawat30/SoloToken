import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import style from "../styles/PotCard.module.css";
import { useAppContext } from "../context/context";
import { shortenPk } from "../utils/helper";
import { Toaster } from "react-hot-toast";
import { SiSolana } from "react-icons/si";
import { BN } from "bn.js";
import { useState, useEffect } from "react";

const PotCard = () => {
  const {
    startTime,
    windowTime,
    endTime,
    lotteryId,
    lotteryPot,
    connected,
    isLotteryAuthority,
    isMasterInitialized,
    initMaster,
    createLottery,
    buyTicket,
    pickWinner,
    claimPrize,
    lotteryHistory,
    isFinished,
    canClaim,
    totalVol,
    totalPlayers,
    myTickets,
    buyMoreTicket,
    lotteryTotalPlayers,
    totalDeposited,
    isMasterAuthority,
    userWinningId,
    transferToken,
    master,
    lottery,
    lotteryTotalDeposit,
    ticket,
    isTransfered,
    tokenClaim,
    isAllowedForToken,
    claimTokens,
    ticketBought,
  } = useAppContext();
  // console.log(isMasterInitialized)
  if (!isMasterInitialized)
    return (
      <div className={style.upperdiv}>
        {connected ? (
          <>
            <div className={style.btn} onClick={initMaster}>
              Initialize master
            </div>
          </>
        ) : (
          <WalletMultiButton className={style.btn} />
        )}
      </div>
    );
  const [timeLeft, setTimeLeft] = useState(0);
  const [endTimeLeft, setEndTimeLeft] = useState(0);

  useEffect(() => {
    let intervalId = null;
    let endIntervalId = null;

    // Clear previous intervals
    clearInterval(intervalId);
    clearInterval(endIntervalId);

    if (startTime && windowTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const distance = Number(windowTime) * 1000 - now;

        // Calculate time left
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });

        // If the countdown is over, clear the interval
        if (distance < 0) {
          clearInterval(intervalId);
        }
      }, 1000);
    }

    if (startTime && endTime) {
      endIntervalId = setInterval(() => {
        const now = new Date().getTime() - 19800;
        const distance = Number(endTime) * 1000 - now;

        // Calculate time left
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setEndTimeLeft({ days, hours, minutes, seconds });

        // If the countdown is over, clear the interval
        if (distance < 0) {
          clearInterval(endIntervalId);
        }
      }, 1000);
    }

    // Clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
      clearInterval(endIntervalId);
    };
  }, [startTime, windowTime, endTime]);

  const now = new Date().getTime();
  const win = Number(windowTime) * 1000 - now;
  const end = Number(endTime) * 1000 - now;
  const checkEnd = win < 0 || end < 0;

  const url =
    "https://s3-alpha-sig.figma.com/img/58a2/b48c/54df34d8c5f6e53b627991182652c733?Expires=1714348800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=QiawW2AaDSQKNVhWTO-GjJ~4XEf98WgAW9~LX3kp0c2v~9Dfb~ARbgYovFHwCOcNJV1zcuWXz16qXpgltdmIauYF8I7p-LlQv6ihYU~7CXC4AWLg5Y0iTH1VMO9kYhSytSTFhtr7uoGDETzhRW5sueMtwmaECgDcD8-akoezpuw3LB0T8VrQVgehDu5z4aExvoRRPryNjFvq-FfvtSp5RPTOqTEqCIvGFwFSezecUMISQNmcjPjIS0lNqMsfayVy1xLwMr~8YGCmUk8gmO-sf0BewUmDSIhcT4W~p-fHk0y~LeW6x3nsX9tXvHcfhS6EJqha9ig8jmR2SNjvM43pjQ__";

  return (
    <>
      <Toaster />
      <div className={style.upperdiv}>
        <div className={style.divtwo}>
          <div className={style.divthree}>
            <h1 className={style.heading}> THE HOME OF CRYPTO THRILLS</h1>
            <p className={style.para}>
              Deposit Solana, race the clock, win big! No winner? We burn SOLO
              Tokens, boost value, and liquidity. Join the thrill, earn rewards,
              in the heart of Web3!
            </p>
          </div>
          <div className={style.divfour}>
            <img className={style.image} src={url} />
          </div>
        </div>
      </div>

      <div className={style.platformstats}>
        <div className={style.innerstat}>
          <h1 className={style.statheading}>Platform Stats</h1>
          <div className={style.infodiv}>
            <div className={style.activeplayer}>
              <div>
                <h3>Active Players</h3>
              </div>
              <div>
                <h1>{lotteryTotalPlayers ? lotteryTotalPlayers : "0"}</h1>
              </div>
            </div>
            <div className={style.activeplayer}>
              <div>
                <h3>Total Players</h3>
              </div>
              <div>
                <h1>{Number(master.totalPlayers)}</h1>
              </div>
            </div>
            <div className={style.activeplayer}>
              <div>
                <h3>Total Game Volume</h3>
              </div>
              <div className={style.solanadiv}>
                <SiSolana className={style.solana} />
                <h1>{Number(master.totalVolume) / 1000000000}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {connected && lottery && !isFinished && (
        <div className={style.platformstats}>
          <div className={style.outerinfodiv}>
            <div className={style.interinfodiv}>
              <div className={style.timediv}>
                <h3>Timer Countdown</h3>
                <div>
                  <h2>
                    {timeLeft && win > 0 && end > 0
                      ? `${timeLeft.minutes} : ${timeLeft.seconds}`
                      : "00:00"}
                  </h2>
                </div>
              </div>
              <div className={style.moneydiv}>
                <h3>Total Deposited</h3>
                <div>
                  <h2>{Number(lotteryTotalDeposit) / 1000000000}</h2>
                  <SiSolana />
                </div>
                <h3>13.32</h3>
              </div>
              <div className={style.timediv}>
                <h3>Game will end in</h3>
                <div>
                  {endTimeLeft ? (
                    <>
                      {endTimeLeft.days < 0 ? (
                        <h2>{endTimeLeft.hours} hours</h2>
                      ) : (
                        <h2>{endTimeLeft.days} days</h2>
                      )}
                    </>
                  ) : (
                    "0 days"
                  )}
                </div>
              </div>
            </div>
            <div className={style.interinfodiv}>
              <div className={style.moneydiv}>
                <h3>Total Tickets</h3>
                <div>
                  <h2>{ticket && ticketBought ? ticketBought : "0"}</h2>
                  <SiSolana />
                </div>
                <h3>13.32</h3>
              </div>
              <div className={style.depositbtn}>
                {lottery ? (
                  <>
                    <h3>Deposit</h3>
                    <div
                      onClick={() => {
                        ticketBought && ticketBought > 0
                          ? buyMoreTicket()
                          : buyTicket();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <h2>0.1</h2>
                      <SiSolana />
                    </div>
                    <h3>13.32</h3>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {connected && lottery ? (
        <>
          {!isFinished ? (
            <div className={style.platformstats}>
              <div className={style.outerinfodiv}>
                <div className={style.notdeclared}>
                  <h1>Available after the initial game concludes.</h1>
                </div>
              </div>
            </div>
          ) : (
            <div className={style.platformstats}>
              <div className={style.outerinfodiv}>
                <div className={style.notdeclared}>
                  <h1>Please Wait until New Game Starts</h1>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <></>
      )}

      {connected && isMasterAuthority && (
        <div className={style.platformstats}>
          <div
            className={style.outerinfodiv}
            style={{ justifyContent: "center" }}
          >
            <div className={style.interinfodiv}>
              <div className={style.timediv} onClick={createLottery}>
                <h3> </h3>
                <div style={{ cursor: "pointer" }}>
                  <h2>Create Lottery</h2>
                </div>
              </div>
              {lottery && checkEnd && (
                <div className={style.timediv}>
                  <h3> </h3>
                  <div style={{ cursor: "pointer" }} onClick={pickWinner}>
                    <h2>Pick Winner</h2>
                  </div>
                </div>
              )}
              {lottery &&
                checkEnd &&
                lottery.winnerId === lottery.lastBoughtId && (
                  <div
                    className={style.timediv}
                    onClick={() => {
                      claimPrize();
                    }}
                  >
                    <h3> </h3>
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        claimPrize();
                      }}
                    >
                      <h2>Give Prize</h2>
                    </div>
                  </div>
                )}
              {lottery &&
                checkEnd &&
                Number(lottery.winnerId) === 4294967295 && (
                  <div className={style.timediv}>
                    <h3></h3>
                    <div
                      style={{ width: "auto", cursor: "pointer" }}
                      onClick={() => {
                        transferToken();
                      }}
                    >
                      <h2>Transfer Tokens</h2>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PotCard;
