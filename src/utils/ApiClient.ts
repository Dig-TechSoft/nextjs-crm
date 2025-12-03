// Temporary authentication backend using PocketBase
// This will be replaced with MT5 WebAPI integration in future updates
import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_BACKEND_URL || "/");

export default pb;
