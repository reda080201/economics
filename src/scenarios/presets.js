export const scenarioSelectGroups = [
  {
    label: "기본 캘리브레이션",
    options: [
      ["baseline", "균형 성장 기본값"],
      ["stableGrowth", "안정 성장 · 추천"],
      ["highRateTightening", "고금리 긴축"],
      ["lowRateLongRun", "저금리 장기화"],
      ["stagflation", "스태그플레이션"]
    ]
  },
  {
    label: "정책·경기 국면",
    options: [
      ["boom", "저금리 투자 붐"],
      ["inflation", "고물가 긴축"],
      ["recovery", "침체 회복"],
      ["welfare", "고세율 고지출"],
      ["financialStress", "금융불안"]
    ]
  },
  {
    label: "시장 실패·성공",
    options: [
      ["housingOverheat", "부동산 과열"],
      ["stockOverheat", "주식시장 과열"],
      ["creditExcessFailure", "시장 실패: 신용 과다"],
      ["supplyBottleneckFailure", "시장 실패: 공급 병목"],
      ["productivityExpansion", "시장 성공: 생산성 확장"]
    ]
  },
  {
    label: "대외·공급 충격",
    options: [
      ["commodityShock", "원자재 충격"],
      ["foreignDemandBoom", "해외수요 호조"],
      ["foreignCapitalOutflow", "해외 자본유출"],
      ["agricultureShock", "농업 공급 충격"],
      ["energyPriceShock", "에너지 가격 충격"]
    ]
  },
  {
    label: "역사 시나리오",
    options: [
      ["koreaImf1997", "한국 IMF 1997"],
      ["usFinancialCrisis2007", "미국 금융위기 2007"],
      ["japanBubbleEconomy", "일본 버블경제"],
      ["germanyReunification", "통일 이후 독일"],
      ["turkiyeInflation2018", "튀르키예 고물가 2018"]
    ]
  }
];
