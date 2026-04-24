import AppNav from "../Components/AppNav";
import Map from "../Components/Map";
import Sidebar from "../Components/Sidebar";

import styles from "./AppLayout.module.css";

function AppLayout() {
  return (
    <div>
      <div className={styles.appContainer}>
        <AppNav />
      </div>
      <div className={styles.app}>
        <Sidebar />
        <Map />
      </div>
    </div>
  );
}

export default AppLayout;
