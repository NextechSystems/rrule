import ENGLISH from './i18n'
import RRule from '../index'

const parseText = function (text, language) {
  const options = {}
  const ttr = new Parser((language || ENGLISH).tokens)

  if (!ttr.start(text)) return null

  S()
  return options

  function S () {
    // every [n]
    let n

    ttr.expect('every')
    if ((n = ttr.accept('number'))) options.interval = parseInt(n[0], 10)
    if (ttr.isDone()) throw new Error('Unexpected end')

    switch (ttr.symbol) {
      case 'day(s)':
        options.freq = RRule.DAILY
        if (ttr.nextSymbol()) {
          AT()
          F()
        }
        break

      // FIXME Note: every 2 weekdays != every two weeks on weekdays.
      // DAILY on weekdays is not a valid rule
      case 'weekday(s)':
        options.freq = RRule.WEEKLY
        options.byweekday = [
          RRule.MO,
          RRule.TU,
          RRule.WE,
          RRule.TH,
          RRule.FR
        ]
        ttr.nextSymbol()
        F()
        break

      case 'week(s)':
        options.freq = RRule.WEEKLY
        if (ttr.nextSymbol()) {
          ON()
          F()
        }
        break

      case 'hour(s)':
        options.freq = RRule.HOURLY
        if (ttr.nextSymbol()) {
          ON()
          F()
        }
        break

      case 'minute(s)':
        options.freq = RRule.MINUTELY
        if (ttr.nextSymbol()) {
          ON()
          F()
        }
        break

      case 'month(s)':
        options.freq = RRule.MONTHLY
        if (ttr.nextSymbol()) {
          ON()
          F()
        }
        break

      case 'year(s)':
        options.freq = RRule.YEARLY
        if (ttr.nextSymbol()) {
          ON()
          F()
        }
        break

      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday':
        options.freq = RRule.WEEKLY
        options.byweekday = [RRule[ttr.symbol.substr(0, 2).toUpperCase()]]

        if (!ttr.nextSymbol()) return

        // TODO check for duplicates
        while (ttr.accept('comma')) {
          if (ttr.isDone()) throw new Error('Unexpected end')

          let wkd
          if (!(wkd = decodeWKD())) {
            throw new Error('Unexpected symbol ' + ttr.symbol + ', expected weekday')
          }

          options.byweekday.push(RRule[wkd])
          ttr.nextSymbol()
        }
        MDAYs()
        F()
        break

      case 'january':
      case 'february':
      case 'march':
      case 'april':
      case 'may':
      case 'june':
      case 'july':
      case 'august':
      case 'september':
      case 'october':
      case 'november':
      case 'december':
        options.freq = RRule.YEARLY
        options.bymonth = [decodeM()]

        if (!ttr.nextSymbol()) return

        // TODO check for duplicates
        while (ttr.accept('comma')) {
          if (ttr.isDone()) throw new Error('Unexpected end')

          let m
          if (!(m = decodeM())) {
            throw new Error('Unexpected symbol ' + ttr.symbol + ', expected month')
          }

          options.bymonth.push(m)
          ttr.nextSymbol()
        }

        ON()
        F()
        break

      default:
        throw new Error('Unknown symbol')
    }
  }

  function ON () {
    const on = ttr.accept('on')
    const the = ttr.accept('the')
    if (!(on || the)) return

    do {
      let nth, wkd, m

      // nth <weekday> | <weekday>
      if ((nth = decodeNTH())) {
        // ttr.nextSymbol()

        if ((wkd = decodeWKD())) {
          ttr.nextSymbol()
          if (!options.byweekday) options.byweekday = []
          options.byweekday.push(RRule[wkd].nth(nth))
        } else {
          if (!options.bymonthday) options.bymonthday = []
          options.bymonthday.push(nth)
          ttr.accept('day(s)')
        }
        // <weekday>
      } else if ((wkd = decodeWKD())) {
        ttr.nextSymbol()
        if (!options.byweekday) options.byweekday = []
        options.byweekday.push(RRule[wkd])
      } else if (ttr.symbol === 'weekday(s)') {
        ttr.nextSymbol()
        if (!options.byweekday) options.byweekday = []
        options.byweekday.push(RRule.MO)
        options.byweekday.push(RRule.TU)
        options.byweekday.push(RRule.WE)
        options.byweekday.push(RRule.TH)
        options.byweekday.push(RRule.FR)
      } else if (ttr.symbol === 'week(s)') {
        ttr.nextSymbol()
        let n
        if (!(n = ttr.accept('number'))) {
          throw new Error('Unexpected symbol ' + ttr.symbol + ', expected week number')
        }
        options.byweekno = [n[0]]
        while (ttr.accept('comma')) {
          if (!(n = ttr.accept('number'))) {
            throw new Error('Unexpected symbol ' + ttr.symbol + '; expected monthday')
          }
          options.byweekno.push(n[0])
        }
      } else if ((m = decodeM())) {
        ttr.nextSymbol()
        if (!options.bymonth) options.bymonth = []
        options.bymonth.push(m)
      } else {
        return
      }
    } while (ttr.accept('comma') || ttr.accept('the') || ttr.accept('on'))
  }

  function AT () {
    const at = ttr.accept('at')
    if (!at) return

    do {
      let n
      if (!(n = ttr.accept('number'))) {
        throw new Error('Unexpected symbol ' + ttr.symbol + ', expected hour')
      }
      options.byhour = [n[0]]
      while (ttr.accept('comma')) {
        if (!(n = ttr.accept('number'))) {
          throw new Error('Unexpected symbol ' + ttr.symbol + '; expected hour')
        }
        options.byhour.push(n[0])
      }
    } while (ttr.accept('comma') || ttr.accept('at'))
  }

  function decodeM () {
    switch (ttr.symbol) {
      case 'january':
        return 1
      case 'february':
        return 2
      case 'march':
        return 3
      case 'april':
        return 4
      case 'may':
        return 5
      case 'june':
        return 6
      case 'july':
        return 7
      case 'august':
        return 8
      case 'september':
        return 9
      case 'october':
        return 10
      case 'november':
        return 11
      case 'december':
        return 12
      default:
        return false
    }
  }

  function decodeWKD () {
    switch (ttr.symbol) {
      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday':
        return ttr.symbol.substr(0, 2).toUpperCase()
      default:
        return false
    }
  }

  function decodeNTH () {
    switch (ttr.symbol) {
      case 'last':
        ttr.nextSymbol()
        return -1
      case 'first':
        ttr.nextSymbol()
        return 1
      case 'second':
        ttr.nextSymbol()
        return ttr.accept('last') ? -2 : 2
      case 'third':
        ttr.nextSymbol()
        return ttr.accept('last') ? -3 : 3
      case 'nth':
        const v = parseInt(ttr.value[1], 10)
        if (v < -366 || v > 366) throw new Error('Nth out of range: ' + v)

        ttr.nextSymbol()
        return ttr.accept('last') ? -v : v

      default:
        return false
    }
  }

  function MDAYs () {
    ttr.accept('on')
    ttr.accept('the')

    let nth
    if (!(nth = decodeNTH())) return

    options.bymonthday = [nth]
    ttr.nextSymbol()

    while (ttr.accept('comma')) {
      if (!(nth = decodeNTH())) {
        throw new Error('Unexpected symbol ' + ttr.symbol + '; expected monthday')
      }

      options.bymonthday.push(nth)
      ttr.nextSymbol()
    }
  }

  function F () {
    if (ttr.symbol === 'until') {
      const date = Date.parse(ttr.text)

      if (!date) throw new Error('Cannot parse until date:' + ttr.text)
      options.until = new Date(date)
    } else if (ttr.accept('for')) {
      options.count = ttr.value[0]
      ttr.expect('number')
      // ttr.expect('times')
    }
  }
}

// =============================================================================
// Parser
// =============================================================================

class Parser {
  constructor (rules) {
    this.rules = rules
  }

  start (text) {
    this.text = text
    this.done = false
    return this.nextSymbol()
  }

  isDone () {
    return this.done && this.symbol == null
  }

  nextSymbol () {
    let best, bestSymbol
    const p = this

    this.symbol = null
    this.value = null
    do {
      if (this.done) return false

      let match, rule
      best = null
      for (let name in this.rules) {
        rule = this.rules[name]
        if ((match = rule.exec(p.text))) {
          if (best == null || match[0].length > best[0].length) {
            best = match
            bestSymbol = name
          }
        }
      }

      if (best != null) {
        this.text = this.text.substr(best[0].length)

        if (this.text === '') this.done = true
      }

      if (best == null) {
        this.done = true
        this.symbol = null
        this.value = null
        return
      }
    } while (bestSymbol === 'SKIP')

    this.symbol = bestSymbol
    this.value = best
    return true
  }

  accept (name) {
    if (this.symbol === name) {
      if (this.value) {
        const v = this.value
        this.nextSymbol()
        return v
      }

      this.nextSymbol()
      return true
    }

    return false
  }

  expect (name) {
    if (this.accept(name)) return true

    throw new Error('expected ' + name + ' but found ' + this.symbol)
  }
}

export default parseText
