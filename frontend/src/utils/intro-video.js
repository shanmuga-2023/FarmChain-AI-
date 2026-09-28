export function replayIntroVideo() {
  sessionStorage.removeItem('farmchainIntroShown');
  window.location.reload();
}
