import PageNav from "../Components/PageNav";
import styles from "./PageNotFound.module.css";

function PageNotFound() {
  return (
    <div className={styles.container}>
      <PageNav />
      <br /> <br />
      <br /> <br />
      <br />
      <br />
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <div className={styles.glitch} data-text="PAGE NOT FOUND">
          PAGE NOT FOUND
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;
