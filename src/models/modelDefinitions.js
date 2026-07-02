export function getModelDefinitions() {
      return {
        keynesian: [
          { key: "mpc", label: "한계소비성향(MPC)", value: 0.75, step: 0.05, help: "추가 소득 중 소비되는 비율입니다." },
          { key: "deltaG", label: "정부지출 변화", value: 100, step: 10, help: "총수요에 직접 더해지는 재정 충격입니다." },
          { key: "deltaIncomeTax", label: "소득세율 변화(%p)", value: 0, step: 0.5, help: "가처분소득을 통해 소비 수요에 작용합니다." },
          { key: "deltaCorporateTax", label: "법인세율 변화(%p)", value: 0, step: 0.5, help: "순이익과 투자 여력에 작용합니다." },
          { key: "autonomousInvestment", label: "자율 투자", value: 80, step: 10 },
          { key: "nx", label: "순수출(NX)", value: 0, step: 10 }
        ],
        phillips: [
          { key: "unemployment", label: "실업률 %", value: 6, step: 0.25 },
          { key: "naturalUnemployment", label: "자연실업률 %", value: 5.6, step: 0.25, help: "정상적으로 작동해도 남는 구조적·마찰적 실업률입니다." },
          { key: "expectedInflation", label: "기대 물가상승률 %", value: 2, step: 0.25, help: "임금과 가격 설정에 반영되는 예상 물가입니다." },
          { key: "beta", label: "민감도 beta", value: 0.45, step: 0.05 },
          { key: "supplyShock", label: "공급 충격", value: 0, step: 0.25 }
        ],
        taylor: [
          { key: "currentInflation", label: "현재 물가상승률 %", value: 2, step: 0.25 },
          { key: "targetInflation", label: "목표 물가상승률 %", value: 2, step: 0.25 },
          { key: "neutralRate", label: "중립 금리 %", value: 3, step: 0.25, help: "경기를 과열도 위축도 시키지 않는 단순 기준 금리입니다." },
          { key: "outputGap", label: "산출갭 %", value: 0, step: 0.5, help: "실제 산출이 잠재 산출보다 높은지 낮은지 보는 지표입니다." },
          { key: "inflationWeight", label: "물가 반응 가중치", value: 1.5, step: 0.1 },
          { key: "outputWeight", label: "산출 반응 가중치", value: 0.5, step: 0.1 }
        ]
      };
    }
