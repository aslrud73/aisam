/**
 * 사용자 친화적 에러 메시지 변환 유틸.
 * 기술적 메시지(영어, status code 등)를 한국 교사가 바로 이해하는 안내문으로.
 */

export function fetchErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "API 키가 올바르지 않은 것 같아요. 설정에서 키를 다시 확인해 주세요.";
  }
  if (status === 404) {
    return "이 모델은 더 이상 사용할 수 없어요. 설정에서 추천 모델로 바꿔 주세요.";
  }
  if (status === 429) {
    return "오늘 사용량이 한도를 넘었어요. 잠시 후 다시 시도하거나, 설정에서 다른 모델을 선택해 주세요.";
  }
  if (status >= 500) {
    return "AI 서버가 잠시 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.";
  }
  return "요청 처리에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

export function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    // 영어 키워드 패턴 매칭
    if (/api[ -]?key|unauthorized|invalid[ -]key/i.test(msg)) {
      return "API 키가 올바르지 않은 것 같아요. 설정에서 키를 다시 확인해 주세요.";
    }
    if (/quota|rate.?limit|too many requests/i.test(msg)) {
      return "오늘 사용량이 한도를 넘었어요. 잠시 후 다시 시도하거나, 설정에서 다른 모델을 선택해 주세요.";
    }
    if (/no longer available|model not found|deprecated/i.test(msg)) {
      return "이 모델은 더 이상 사용할 수 없어요. 설정에서 추천 모델로 바꿔 주세요.";
    }
    if (/network|fetch|timeout|econn|enotfound/i.test(msg)) {
      return "네트워크 연결이 잠시 끊겼어요. 인터넷을 확인하고 다시 시도해 주세요.";
    }
    // 한국어가 이미 들어 있으면(우리가 직접 던진 메시지) 그대로 노출
    if (/[ㄱ-힝가-힣]/.test(msg) && msg.length < 200) {
      return msg;
    }
    return "AI 응답에 일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
  }
  return "잠시 후 다시 시도해 주세요. 계속되면 도움말의 FAQ를 참고해 주세요.";
}
