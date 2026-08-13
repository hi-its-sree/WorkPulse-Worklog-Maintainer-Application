// The async clipboard API only exists in a secure context, and the planner is often
// opened over plain HTTP on the office network, so keep a textarea fallback.
export const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Permission denied or insecure origin: fall through to the fallback below.
    }
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch (error) {
    return false;
  }
};

export default copyTextToClipboard;
