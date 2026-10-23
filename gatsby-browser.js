import "./src/styles.css";
export const onClientEntry = () => {
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {}),
    );
  }
};
