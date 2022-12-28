import { UserMediaWrapper } from "../lib/media-device-wrapper";

// const appDiv = document.querySelector<HTMLDivElement>('#app')!;
const videoElement = document.getElementsByTagName("video")[0];
const userMedia = new UserMediaWrapper({ video: true });

// @ts-ignore
window["userMedia"] = userMedia;

userMedia.on("open", () => {
  console.debug("open", userMedia.stream);
  videoElement.srcObject = userMedia.stream;

  // @ts-ignore
  window["videoTrack"] = userMedia.videoTrack;
  // @ts-ignore
  window["audioTrack"] = userMedia.audioTrack;

  videoElement.play();
});

userMedia.on("close", () => {
  console.debug("close");
  videoElement.srcObject = null;
  // @ts-ignore
  window["videoTrack"] = undefined;
  // @ts-ignore
  window["audioTrack"] = undefined;
});

document.querySelector<HTMLButtonElement>("#open-button")!.onclick = async () => {
  await userMedia.open();
};

document.querySelector<HTMLButtonElement>("#close-button")!.onclick = async () => {
  userMedia.close();
};

document.addEventListener("DOMContentLoaded", async () => {
  const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
  console.debug("supported constraints", supportedConstraints);
})