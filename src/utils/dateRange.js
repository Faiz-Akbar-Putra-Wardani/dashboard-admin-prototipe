import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
dayjs.extend(minMax);

export const getDateRange = (details) => {
  if (!details || details.length === 0) return { start: "-", end: "-", multiple: false };

  const startDates = details.map(d => dayjs(d.start_date));
  const endDates = details.map(d => dayjs(d.end_date));

  const minStart = dayjs.min(startDates);
  const maxEnd = dayjs.max(endDates);

  return {
    start: minStart.format("DD MMM YYYY"),
    end:  maxEnd.format("DD MMM YYYY"),
    // true jika dalam detailnya lebih dari 1 tanggal
    multiple: startDates.length > 1 || endDates.length > 1
  };
};
