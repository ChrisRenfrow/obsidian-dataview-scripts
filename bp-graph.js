const genData = (sampleSize) => {
  const dailyNoteQuery = '"Journal"';
  const endDate = new Date(Date.now());
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - sampleSize);

  const dateRange = ((startDate, endDate) => {
    const range = [];
    var currentDate = new Date(startDate);
    while (currentDate < endDate) {
      range.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return range;
  })(startDate, endDate);

  const sysConfig = {
    label: "Systolic",
    borderColor: "hsl(30deg, 50%, 50%)",
    backgroundColor: "hsla(0deg, 0%, 50%, 10%)",
    tension: 0.2,
    spanGaps: true,
    fill: 1,
    order: 2,
  };
  const diaConfig = {
    label: "Diastolic",
    borderColor: "hsl(180deg, 50%, 50%)",
    tension: 0.2,
    spanGaps: true,
    order: 2,
  };

  // I use YYYY-MM-DD for naming my daily notes (the default, I think),
  // so default alphanum sort is all I need.
  const result = dv.pages(dailyNoteQuery).sort((j) => j.file.name);

  const pageData = result.array().reduce(
    (acc, j) => [
      ...acc,
      {
        date: j.file.name,
        bp: j.bp_log,
      },
    ],
    [],
  );

  const dateListTitleFormat = dateRange.map((d) => {
    let padMonth = (d.getMonth() + 1).toString().padStart(2, "0");
    let padDate = (d.getDate() + 1).toString().padStart(2, "0");
    return `${d.getFullYear()}-${padMonth}-${padDate}`;
  });

  const pageDataMap = pageData.reduce((acc, page) => {
    acc.set(page.date, page.bp);
    return acc;
  }, new Map());

  const datasets = dateListTitleFormat.reduce(
    (acc, date) => {
      var result = { sys: undefined, dia: undefined };
      var data = pageDataMap.get(date);
      if (data) {
        if (data.constructor === Array) {
          // If the readings are a list, average the readings
          // We should filter any nulls since empty fields can cause issues
          let readings = data.filter((r) => r !== null);
          let sum = readings.reduce(
            (acc, r) => {
              let reading = r.split(",")[0];
              let pair = reading.split("/");
              return {
                sys: acc.sys + Number(pair[0]),
                dia: acc.dia + Number(pair[1]),
              };
            },
            { sys: 0, dia: 0 },
          );
          result.sys = sum.sys / readings.length;
          result.dia = sum.dia / readings.length;
        } else {
          let reading = data.split(",")[0];
          let pair = reading.split("/");
          result.sys = Number(pair[0]);
          result.dia = Number(pair[1]);
        }
      }

      return { sys: [...acc.sys, result.sys], dia: [...acc.dia, result.dia] };
    },
    { sys: [], dia: [] },
  );

  // Generates the data to plot a horizontal threshold line
  // len: the length of the dataset
  // threshold: the y position of the line
  const genThresholdData = (len, threshold) => {
    let a = Array(len);
    a[0] = threshold;
    a[len - 1] = threshold;
    return a;
  };

  const commonGuideConfig = {
    borderWidth: 1,
    pointRadius: 0,
    spanGaps: true,
    fill: "stack",
  };

  const sysGuideConfig = {
    borderDash: [5, 2],
  };

  const diaGuideConfig = {
    borderDash: [2, 4],
    borderLineCap: "round",
  };

  const normalRangeSysGuide = {
    ...commonGuideConfig,
    ...sysGuideConfig,
    label: "Normal (Sys)",
    borderColor: "hsla(90deg, 40%, 50%, 50%)",
    backgroundColor: "hsla(90deg, 20%, 50%, 10%)",
    data: genThresholdData(sampleSize, 120),
  };

  const elevatedRangeSysGuide = {
    ...commonGuideConfig,
    ...sysGuideConfig,
    label: "Elevated (Sys)",
    borderColor: "hsla(50deg, 40%, 50%, 50%)",
    backgroundColor: "hsla(50deg, 20%, 50%, 10%)",
    data: genThresholdData(sampleSize, 130),
  };

  const htS1RangeSysGuide = {
    ...commonGuideConfig,
    ...sysGuideConfig,
    label: "Hypertension S1 (Sys)",
    borderColor: "hsla(20deg, 40%, 50%, 50%)",
    backgroundColor: "hsla(20deg, 20%, 50%, 10%)",
    data: genThresholdData(sampleSize, 140),
  };

  const htS2RangeSysGuide = {
    ...commonGuideConfig,
    ...sysGuideConfig,
    label: "Hypertension S2 (Sys)",
    borderColor: "hsla(0deg, 40%, 50%, 50%)",
    backgroundColor: "hsla(0deg, 20%, 50%, 10%)",
    data: genThresholdData(sampleSize, 180),
  };

  const normalRangeDiaGuide = {
    ...commonGuideConfig,
    ...diaGuideConfig,
    label: "Normal (Dia)",
    borderColor: "hsla(90deg, 40%, 50%, 50%)",
    backgroundColor: "hsla(90deg, 20%, 50%, 10%)",
    data: genThresholdData(sampleSize, 80),
  };

  const htS1RangeDiaGuide = {
    ...commonGuideConfig,
    ...diaGuideConfig,
    label: "Hypertension S1 (Dia)",
    borderColor: "hsla(20deg, 40%, 50%, 50%)",
    backgroundColor: "hsla(20deg, 20%, 50%, 10%)",
    data: genThresholdData(sampleSize, 90),
  };

  return {
    type: "line",
    data: {
      labels: dateListTitleFormat,
      datasets: [
        { ...sysConfig, data: datasets.sys },
        { ...diaConfig, data: datasets.dia },
        normalRangeDiaGuide, // 80
        htS1RangeDiaGuide, // 90
        normalRangeSysGuide, // 120
        elevatedRangeSysGuide, // 130
        htS1RangeSysGuide, // 140
        htS2RangeSysGuide, // 180
      ],
    },
    options: {
      animation: false,
      scales: {
        y: {
          suggestedMin: 60,
          suggestedMax: 180,
        },
      },
      plugins: {
        legend: {
          position: "none",
        },
      },
    },
  };
};

(({ context: ctx, sampleSize = 28 }) => {
  window.renderChart(genData(sampleSize), ctx.container);
})(input);
