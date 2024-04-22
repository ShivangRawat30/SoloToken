import { useAppContext } from "../context/context";
import style from "../styles/Table.module.css";
import TableRow from "./TableRow";

const Table = () => {
  const { lotteryHistory } = useAppContext();

  return (
    <>
    <h2 className={style.activity}>Activity</h2>
    <div className={style.wrapper}>
      <div className={style.tableHeader}>
      <div className={style.addressTitle}>#</div>
        <div className={style.addressTitle}>Prize Pool</div>
        <div className={style.addressTitle}>Total Winning</div>
        <div className={style.amountTitle}>Players</div>
        <div className={style.amountTitle}>Entries</div>
        <div className={style.amountTitle}>Date</div>
      </div>
      <div className={style.rows}>
        {lotteryHistory?.map((h, i) => (
          <TableRow key={i} {...h} />
          ))}
      </div>
    </div>
    {/* <div className={style.wrapper}>
      <div className={style.tableHeader}>
        <div className={style.addressTitle}>💳 Lottery</div>
        <div className={style.addressTitle}>💳 Address</div>
        <div className={style.addressTitle}>💳 Ticket</div>
        <div className={style.amountTitle}>💲 Amount</div>
      </div>
      <div className={style.rows}>
        {lotteryHistory?.map((h, i) => (
          <TableRow key={i} {...h} />
          ))}
      </div>
    </div> */}
    </>
  );
};

export default Table;
