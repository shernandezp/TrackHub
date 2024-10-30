export function countRecentDevices(devices, interval) {
    const now = new Date();
    const timeAgo = new Date(now.getTime() - 60 * interval * 1000);
    const recentDevices = devices.filter(device => {
      const deviceDateTime = new Date(device.deviceDateTime);
      return deviceDateTime > timeAgo && deviceDateTime <= now;
    });
    return recentDevices.length;
  }

  export function countDevicesInMovement(devices) {
    const movingDevices = devices.filter(device => device.speed > 0);
    return movingDevices.length;
  }

  export function getPercentage(count, total) {
    const percentage = total && total > 0 ? (count / total) * 100 : 0;
    return percentage.toFixed(2);
  }