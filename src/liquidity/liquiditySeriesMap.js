export const liquiditySeriesMap = {
  walcl: {
    seriesId: "WALCL",
    label: "Fed 총자산",
    category: "cash",
    fallbackStart: 4100000,
    fallbackMonthlyDrift: 18000,
    fallbackCycle: 85000
  },
  tga: {
    seriesId: "WTREGEN",
    label: "재무부 일반계정",
    category: "cash",
    fallbackStart: 520000,
    fallbackMonthlyDrift: 2500,
    fallbackCycle: 95000
  },
  rrp: {
    seriesId: "RRPONTSYD",
    label: "역레포 잔액",
    category: "cash",
    fallbackStart: 900000,
    fallbackMonthlyDrift: -6500,
    fallbackCycle: 160000
  },
  m2: {
    seriesId: "M2SL",
    label: "M2",
    category: "cash",
    fallbackStart: 15500,
    fallbackMonthlyDrift: 38,
    fallbackCycle: 360
  },
  bankDeposits: {
    seriesId: "DPSACBW027SBOG",
    label: "상업은행 예금",
    category: "cash",
    fallbackStart: 13200,
    fallbackMonthlyDrift: 32,
    fallbackCycle: 290
  },
  moneyMarketFunds: {
    seriesId: "MMMFFAQ027S",
    label: "머니마켓펀드",
    category: "cash",
    fallbackStart: 3600,
    fallbackMonthlyDrift: 26,
    fallbackCycle: 260
  },
  highYieldOas: {
    seriesId: "BAMLH0A0HYM2",
    label: "하이일드 OAS",
    category: "credit",
    fallbackStart: 4.2,
    fallbackMonthlyDrift: -0.01,
    fallbackCycle: 0.9
  },
  bbbOas: {
    seriesId: "BAMLC0A4CBBB",
    label: "BBB 회사채 OAS",
    category: "credit",
    fallbackStart: 1.85,
    fallbackMonthlyDrift: -0.002,
    fallbackCycle: 0.28
  },
  housePrice: {
    seriesId: "CSUSHPISA",
    label: "Case-Shiller 주택가격",
    category: "asset",
    fallbackStart: 210,
    fallbackMonthlyDrift: 1.05,
    fallbackCycle: 8
  },
  sp500: {
    seriesId: "SP500",
    label: "S&P 500",
    category: "asset",
    fallbackStart: 2900,
    fallbackMonthlyDrift: 30,
    fallbackCycle: 260
  },
  dollarIndex: {
    seriesId: "DTWEXBGS",
    label: "무역가중 달러지수",
    category: "external",
    fallbackStart: 115,
    fallbackMonthlyDrift: 0.02,
    fallbackCycle: 5
  }
};

export const liquiditySeriesKeys = Object.keys(liquiditySeriesMap);

export const liquidityCategoryLabels = {
  cash: "현금 유동성",
  credit: "신용 유동성",
  asset: "자산시장 유동성",
  external: "대외 유동성"
};
