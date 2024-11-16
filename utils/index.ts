export const greetingMessage = () => {
  const currentTime = new Date().getHours();

  if (currentTime < 12) {
    return "Good Morning";
  } else if (currentTime < 15) {
    return "Good Afternoon";
  } else if (currentTime < 18) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};
