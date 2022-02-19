const nextActions = ['play again', 'exit'] as const
type NextActions = typeof nextActions[number]

class GameProcedure {
  private currentGameTitle = 'hit and blow'
  private currentGame = new HitAndBlow()

  public async start() {
    await this.play()
  }

  private async play() {
    printLine(`===\n${this.currentGameTitle}を開始します。\n====`)
    await this.currentGame.setting()
    await this.currentGame.play()
    this.currentGame.end()
    const action = await promptSelect<NextActions>('ゲームを続けますか', nextActions)
    if (action === 'play again') {
      await this.play()
    } else if (action === 'exit') {
      this.end()
    } else {
      const neverValue: never = action
      throw new Error(`${neverValue} is an invalid action.`)
    }
  }

  private end() {
    printLine('ゲームを終了しました。')
    process.exit()
  }
}


const readLine = async () => {
  const input: string = await new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString()))
  })
  return input.trim()
}

const printLine = (text: string, breakLine: boolean = true) => {
  process.stdout.write(text + (breakLine ? '\n' : ''))
}

const promptInput = async (text: string) => {
  printLine(`\n${text}\n>`, false)
  return readLine()
}

const promptSelect = async <T extends string>(text: string, values: readonly T[]): Promise<T> => {
  printLine(`\n${text}`)
  values.forEach((value) => {
    printLine(`- ${value}`)
  })
  printLine(`> `, false)

  const input = (await readLine()) as T
  if (values.includes(input)) {
    return input
  } else {
    return promptSelect<T>(text, values)
  }

}

const modes = ['normal', 'hard'] as const
type Mode = typeof modes[number]

class HitAndBlow {
  private readonly answerSource = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  private answer: string[] = []
  private tryCount = 0
  private mode: Mode = 'normal'

  private getAnserLength() {
    switch (this.mode) {
      case 'normal':
        return 3;
      case 'hard':
        return 4
      default:
        throw new Error(`${this.mode}は無効なモードです。`)
    }
  }

  async setting() {
    this.mode = await promptSelect<Mode>('モードを入力してください。', modes)
    const answerLength = this.getAnserLength()

    while (this.answer.length < answerLength) {
      const randNum = Math.floor(Math.random() * this.answerSource.length)
      const selectedItem = this.answerSource[randNum]
      if (!this.answer.includes(selectedItem)) {
        this.answer.push(selectedItem)
      }
    }
  }

  async play() {
    const answerLength = this.getAnserLength()
    const inpuArr = (await promptInput(`「,」区切りで${answerLength}つの数字を入力してください`)).split(',')
    if (!this.validate(inpuArr)) {
      printLine('無効な入力です')
      await this.play()
      return
    }
    const result = this.check(inpuArr)
    if (result.hit !== this.answer.length) {
      printLine(`-----\nHit: ${result.hit}\nBlow: ${result.blow}\n----`)
      this.tryCount += 1
      await this.play()
    } else {
      this.tryCount += 1
    }
  }

  private validate(inputArr: string[]) {
    const isLengthValid = inputArr.length === this.answer.length
    const isAllAnserSrouceOption = inputArr.every((val) => this.answerSource.includes(val))
    const isAllDifferentValues = inputArr.every((val, i) => inputArr.indexOf(val) === i)
    return isLengthValid && isAllAnserSrouceOption && isAllDifferentValues
  }

  private check(input: string[]) {
    let hitCount = 0
    let blowCount = 0

    input.forEach((val, index) => {
      if (val === this.answer[index]) {
        hitCount += 1
      } else if (this.answer.includes(val)) {
        blowCount += 1
      }
    })

    return {
      hit: hitCount,
      blow: blowCount,
    }
  }

  end() {
    printLine(`正解です！\n試行回数: ${this.tryCount}回`)
    this.reset()
  }

  private reset() {
    this.answer = []
    this.tryCount = 0
  }
}

; (async () => {
  new GameProcedure().start()
})()
