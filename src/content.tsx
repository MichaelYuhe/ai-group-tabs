import { createRoot } from "react-dom/client";
import { getStorage } from "./utils";

// Inject a toaster
(async () => {
  const toasterEnabled = await getStorage<boolean>("toasterEnabled");

  if (!toasterEnabled) return;

  const ele = document.createElement("div");
  document.body.appendChild(ele);

  createRoot(ele).render(<div />);
})();
