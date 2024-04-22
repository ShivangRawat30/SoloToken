import style from '../styles/Header.module.css'
import { BsTwitterX } from "react-icons/bs";
import { FaTelegram } from "react-icons/fa";
const Footer = () => {
    return(
        <div className={style.wrapper}>
            <h1 className={style.logo}>Solo Token</h1>
            <div className={style.teleicon}>
            <BsTwitterX width="24" height="24"/>
            <FaTelegram />
            </div>
        </div>
    )
};

export default Footer;