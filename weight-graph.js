function genDateRange(startDate, endDate) {
  const range = [];
  var currentDate = new Date(startDate);
  while (currentDate < endDate) {
    range.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return range;
}

function formatDateAsTitle(date) {
  let padMonth = (date.getMonth() + 1).toString().padStart(2, "0");
  let padDate = (date.getDate() + 1).toString().padStart(2, "0");
  return `${date.getFullYear()}-${padMonth}-${padDate}`;
}

function genData(sampleSize) {
  const dailyNoteQuery = '"Journal"';
  const endDate = new Date(Date.now());
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - sampleSize);
  const dateRange = genDateRange(startDate, endDate).map(formatDateAsTitle);

  const queryResult = dv.pages(dailyNoteQuery);
  const pageDataMap = queryResult.array().reduce((acc, page) => {
    acc.set(page.file.name, page.weight_log ? page.weight_log : undefined);
    return acc;
  }, new Map());

  const weightData = dateRange.map((date) => {
    let data = pageDataMap.get(date);
    if (data) {
      return Number(data);
    }
    return undefined;
  });

  const weightConfig = {
    label: "Weight (lbs)",
    borderColor: "hsl(10deg, 50%, 50%)",
    backgroundColor: "hsla(10deg, 50%, 50%, 10%)",
    spanGaps: true,
    fill: true,
    tension: 0.2,
  };

  return {
    type: "line",
    data: {
      labels: dateRange,
      datasets: [{ ...weightConfig, data: weightData }],
    },
    options: {
      animation: false,
    },
  };
}

function entrypoint({ context: ctx, sampleSize = 7 }) {
  window.renderChart(genData(sampleSize), ctx.container);
}

entrypoint(input);
