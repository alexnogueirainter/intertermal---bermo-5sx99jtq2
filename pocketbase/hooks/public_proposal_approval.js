/**
 * PocketBase Hook: Public Proposal Client Approval & View by Token
 * Route: GET /api/public/proposals/:token -> retorna dados seguros da proposta para visualização do cliente sem login
 * Route: POST /api/public/proposals/:token/action -> aprova ou reprova a proposta, registra nome + data e gera OS automaticamente se aprovada
 * Extras: aviso no painel (activities) quando o cliente ABRE, APROVA ou RECUSA a proposta;
 * QR code + link de aprovação no e-mail de aceite.
 */

// QR Code Generator for JavaScript (MIT, kazuhikoarase/qrcode-generator) — gera o SVG do QR
// do link de aprovação embutido no e-mail. Biblioteca inline para uso no runtime do hook.
var qrcode = (function () {
  //---------------------------------------------------------------------
  //
  // QR Code Generator for JavaScript
  //
  // Copyright (c) 2009 Kazuhiko Arase
  //
  // URL: http://www.d-project.com/
  //
  // Licensed under the MIT license:
  //	http://www.opensource.org/licenses/mit-license.php
  //
  // The word 'QR Code' is registered trademark of
  // DENSO WAVE INCORPORATED
  //	http://www.denso-wave.com/en/pc/tech/patent/index.html
  //
  //---------------------------------------------------------------------

  // qrcode factory
  return function (typeNumber, errorCorrectionLevel) {
    var PAD0 = 0xec
    var PAD1 = 0x11

    var _typeNumber = typeNumber
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel]
    var _modules = null
    var _moduleCount = 0
    var _dataCache = null
    var _dataList = []

    var _this = {}

    var makeImpl = function (test, maskPattern) {
      _moduleCount = _typeNumber * 4 + 17
      _modules = (function (moduleCount) {
        var modules = new Array(moduleCount)
        for (var row = 0; row < modules.length; row += 1) {
          modules[row] = new Array(moduleCount)
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null
          }
        }
        return modules
      })(_moduleCount)

      setupPositionProbePattern(0, 0)
      setupPositionProbePattern(_moduleCount - 7, 0)
      setupPositionProbePattern(0, _moduleCount - 7)
      setupPositionAdjustPattern()
      setupTimingPattern()

      setupTypeInfo(test, maskPattern)

      if (_typeNumber >= 7) {
        setupTypeNumber(test)
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList)
      }

      mapData(_dataCache, maskPattern)
    }

    var setupPositionProbePattern = function (row, col) {
      for (var r = -1; r <= 7; r += 1) {
        if (row + r <= -1 || _moduleCount <= row + r) continue

        for (var c = -1; c <= 7; c += 1) {
          if (col + c <= -1 || _moduleCount <= col + c) continue

          if (
            (0 <= r && r <= 6 && (c == 0 || c == 6)) ||
            (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)
          ) {
            _modules[row + r][col + c] = true
          } else {
            _modules[row + r][col + c] = false
          }
        }
      }
    }

    var getBestMaskPattern = function () {
      var minLostPoint = 0
      var pattern = 0

      for (var i = 0; i < 8; i += 1) {
        makeImpl(true, i)

        var lostPoint = QRUtil.getLostPoint(_this)

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint
          pattern = i
        }
      }

      return pattern
    }

    var setupTimingPattern = function () {
      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][8] != null) {
          continue
        }
        _modules[r][8] = r % 2 == 0
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[8][c] != null) {
          continue
        }
        _modules[8][c] = c % 2 == 0
      }
    }

    var setupPositionAdjustPattern = function () {
      var pos = QRUtil.getPatternPosition(_typeNumber)

      for (var i = 0; i < pos.length; i += 1) {
        for (var j = 0; j < pos.length; j += 1) {
          var row = pos[i]
          var col = pos[j]

          if (_modules[row][col] != null) {
            continue
          }

          for (var r = -2; r <= 2; r += 1) {
            if (row + r <= -1 || _moduleCount <= row + r) continue
            if (col + r <= -1 || _moduleCount <= col + r) continue

            if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
              _modules[row + r][col + r] = true
            } else {
              _modules[row + r][col + r] = false
            }
          }
        }
      }
    }

    var setupTypeNumber = function (test) {
      var bits = QRUtil.getBCHTypeNumber(_typeNumber)

      for (var i = 0; i < 18; i += 1) {
        var mod = !test && ((bits >> i) & 1) == 1

        _modules[Math.floor(i / 3)][(i % 3) + _moduleCount - 8 - 3] = mod
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = !test && ((bits >> i) & 1) == 1

        _modules[(i % 3) + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod
      }
    }

    var setupTypeInfo = function (test, maskPattern) {
      var data = (_errorCorrectionLevel << 3) | maskPattern
      var bits = QRUtil.getBCHTypeInfo(data)

      // vertical
      for (var i = 0; i < 15; i += 1) {
        var mod = !test && ((bits >> i) & 1) == 1

        if (i < 6) {
          _modules[i][8] = mod
        } else if (i < 8) {
          _modules[i + 1][8] = mod
        } else {
          _modules[_moduleCount - 15 + i][8] = mod
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {
        var mod = !test && ((bits >> i) & 1) == 1

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod
        } else {
          _modules[8][15 - i - 1] = mod
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = !test
    }

    var mapData = function (data, maskPattern) {
      var inc = -1
      var row = _moduleCount - 1
      var bitIndex = 7
      var byteIndex = 0
      var maskFunc = QRUtil.getMaskFunction(maskPattern)

      for (var col = _moduleCount - 1; col > 0; col -= 2) {
        if (col == 6) col -= 1

        while (true) {
          for (var c = 0; c < 2; c += 1) {
            if (_modules[row][col - c] == null) {
              var dark = false

              if (byteIndex < data.length) {
                dark = ((data[byteIndex] >>> bitIndex) & 1) == 1
              }

              var mask = maskFunc(row, col - c)

              if (mask) {
                dark = !dark
              }

              _modules[row][col - c] = dark
              bitIndex -= 1

              if (bitIndex == -1) {
                byteIndex += 1
                bitIndex = 7
              }
            }
          }

          row += inc

          if (row < 0 || _moduleCount <= row) {
            row -= inc
            inc = -inc
            break
          }
        }
      }
    }

    var createBytes = function (buffer, rsBlocks) {
      var offset = 0

      var maxDcCount = 0
      var maxEcCount = 0

      var dcdata = new Array(rsBlocks.length)
      var ecdata = new Array(rsBlocks.length)

      for (var r = 0; r < rsBlocks.length; r += 1) {
        var dcCount = rsBlocks[r].dataCount
        var ecCount = rsBlocks[r].totalCount - dcCount

        maxDcCount = Math.max(maxDcCount, dcCount)
        maxEcCount = Math.max(maxEcCount, ecCount)

        dcdata[r] = new Array(dcCount)

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset]
        }
        offset += dcdata[r].length

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount)
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1)

        var modPoly = rawPoly.mod(rsPoly)
        ecdata[r] = new Array(rsPoly.getLength() - 1)
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length
          ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0
        }
      }

      var totalCodeCount = 0
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount
      }

      var data = new Array(totalCodeCount)
      var index = 0

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i]
            index += 1
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i]
            index += 1
          }
        }
      }

      return data
    }

    var createData = function (typeNumber, errorCorrectionLevel, dataList) {
      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel)

      var buffer = qrBitBuffer()

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i]
        buffer.put(data.mode, 4)
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber))
        data.write(buffer)
      }

      // calc num total data count
      var totalDataCount = 0
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error(
          'code length overflow. (' + buffer.getLengthInBits() + '>' + totalDataCount * 8 + ')',
        )
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4)
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false)
      }

      // padding
      while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break
        }
        buffer.put(PAD0, 8)

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break
        }
        buffer.put(PAD1, 8)
      }

      return createBytes(buffer, rsBlocks)
    }

    _this.addData = function (data) {
      var newData = qr8BitByte(data)
      _dataList.push(newData)
      _dataCache = null
      return _this
    }

    _this.isDark = function (row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw new Error(row + ',' + col)
      }
      return _modules[row][col]
    }

    _this.getModuleCount = function () {
      return _moduleCount
    }

    _this.make = function () {
      makeImpl(false, getBestMaskPattern())
    }

    _this.createSvgTag = function (props) {
      var cellSize = 4
      var margin = 4
      if (typeof props == 'object') {
        if (typeof props.cellSize == 'number') cellSize = props.cellSize
        if (typeof props.margin == 'number') margin = props.margin
      }
      var size = (_moduleCount + margin * 2) * cellSize
      var rect = ''
      for (var row = 0; row < _moduleCount; row += 1) {
        for (var col = 0; col < _moduleCount; col += 1) {
          if (_modules[row][col]) {
            rect +=
              'M' +
              (col * cellSize + margin * cellSize) +
              ',' +
              (row * cellSize + margin * cellSize) +
              'h' +
              cellSize +
              'v' +
              cellSize +
              'h-' +
              cellSize +
              'z '
          }
        }
      }
      return (
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="' +
        size +
        'px" height="' +
        size +
        'px" viewBox="0 0 ' +
        size +
        ' ' +
        size +
        '" preserveAspectRatio="xMinYMin meet"><rect width="100%" height="100%" fill="white"/><path d="' +
        rect +
        '" stroke="transparent" fill="black"/></svg>'
      )
    }

    return _this
  }

  //---------------------------------------------------------------------
  // qrcode8bitbyte
  //---------------------------------------------------------------------

  var qr8BitByte = function (data) {
    var _mode = 4 // mode: 8bit byte
    var _data = data
    var parsedData = []

    var _this = {}

    _this.write = function (buffer) {
      for (var i = 0; i < parsedData.length; i += 1) {
        buffer.put(parsedData[i], 8)
      }
    }

    _this.getLength = function () {
      return parsedData.length
    }

    // UTF-8 encode
    ;(function () {
      var byteArray = qr8BitByte_utf8bytes(_data)
      parsedData = byteArray
    })()

    _this.mode = _mode

    return _this
  }

  var qr8BitByte_utf8bytes = function (str) {
    var byteArray = []
    // UTF-8 encode (same as qrcode-generator's stringToBytes_UTF8)
    var utf8 = unescape(encodeURIComponent(str))
    for (var i = 0; i < utf8.length; i += 1) {
      byteArray.push(utf8.charCodeAt(i))
    }
    return byteArray
  }

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  var qrPolynomial = function (num, shift) {
    if (typeof num.length == 'undefined') {
      throw new Error(num.length + '/' + shift)
    }

    var _num = (function () {
      var num2 = new Array(num.length)
      for (var i = 0; i < num.length; i += 1) num2[i] = num[i]
      while (num2.length > 0 && num2[0] == 0) {
        num2.shift()
      }
      return num2
    })()

    var _this = {}

    _this.getAt = function (index) {
      return _num[index]
    }

    _this.getLength = function () {
      return _num.length
    }

    _this.multiply = function (e) {
      var num = new Array(_num.length + e.getLength() - 1)

      for (var i = 0; i < _num.length; i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_num[i]) + QRMath.glog(e.getAt(j)))
        }
      }

      return qrPolynomial(num, 0)
    }

    _this.mod = function (e) {
      if (_num.length - e.getLength() < 0) {
        return _this
      }

      var ratio = QRMath.glog(_num[0]) - QRMath.glog(e.getAt(0))

      var num = new Array(_num.length)
      for (var i = 0; i < _num.length; i += 1) {
        num[i] = _num[i]
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio)
      }

      return qrPolynomial(num, 0).mod(e)
    }

    return _this
  }

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = (function () {
    var RS_BLOCK_TABLE = [
      // L, M, Q, H
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 6, 51, 23],
      [4, 50, 16, 6, 51, 17],

      [6, 116, 92],
      [2, 58, 46, 2, 59, 47],
      [4, 46, 24, 6, 47, 25],
      [6, 45, 15, 2, 46, 16],

      [2, 68, 52, 4, 69, 53],
      [4, 62, 46, 1, 63, 47],
      [6, 44, 20, 2, 45, 21],
      [6, 45, 15, 2, 46, 16],

      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      [4, 144, 116, 4, 145, 117],
      [11, 68, 42, 14, 69, 43],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16],
    ]

    var qrRSBlock = function (totalCount, dataCount) {
      return { totalCount: totalCount, dataCount: dataCount }
    }

    var _this = {}

    _this.getRSBlocks = function (typeNumber, errorCorrectionLevel) {
      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel)

      if (typeof rsBlock == 'undefined') {
        throw new Error(
          'bad rs block @ typeNumber:' +
            typeNumber +
            '/errorCorrectionLevel:' +
            errorCorrectionLevel,
        )
      }

      var length = rsBlock.length / 3

      var list = []

      for (var i = 0; i < length; i += 1) {
        var count = rsBlock[i * 3 + 0]
        var totalCount = rsBlock[i * 3 + 1]
        var dataCount = rsBlock[i * 3 + 2]

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount))
        }
      }

      return list
    }

    var getRsBlockTable = function (typeNumber, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case 1: // L
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0]
        case 0: // M
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1]
        case 3: // Q
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2]
        case 2: // H
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3]
        default:
          return undefined
      }
    }

    return _this
  })()

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function () {
    var _buffer = []
    var _length = 0

    var _this = {}

    _this.getBuffer = function () {
      return _buffer
    }

    _this.getAt = function (index) {
      var bufIndex = Math.floor(index / 8)
      return ((_buffer[bufIndex] >>> (7 - (index % 8))) & 1) == 1
    }

    _this.put = function (num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit(((num >>> (length - i - 1)) & 1) == 1)
      }
    }

    _this.getLengthInBits = function () {
      return _length
    }

    _this.putBit = function (bit) {
      var bufIndex = Math.floor(_length / 8)
      if (_buffer.length <= bufIndex) {
        _buffer.push(0)
      }

      if (bit) {
        _buffer[bufIndex] |= 0x80 >>> (_length % 8)
      }

      _length += 1
    }

    return _this
  }

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = (function () {
    var EXP_TABLE = new Array(256)
    var LOG_TABLE = new Array(256)

    // init tables
    ;(function () {
      for (var i = 0; i < 8; i += 1) {
        EXP_TABLE[i] = 1 << i
      }
      for (var i = 8; i < 256; i += 1) {
        EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8]
      }
      for (var i = 0; i < 255; i += 1) {
        LOG_TABLE[EXP_TABLE[i]] = i
      }
    })()

    var _this = {}

    _this.glog = function (n) {
      if (n < 1) {
        throw new Error('glog(' + n + ')')
      }

      return LOG_TABLE[n]
    }

    _this.gexp = function (n) {
      while (n < 0) {
        n += 255
      }

      while (n >= 256) {
        n -= 255
      }

      return EXP_TABLE[n]
    }

    return _this
  })()

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = [1, 0, 3, 2] // L=1, M=0, Q=3, H=2

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = (function () {
    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 46, 70],
      [6, 26, 46, 74],
      [6, 34, 62, 78],
      [6, 30, 54, 86],
      [6, 30, 54, 90],
      [6, 30, 54, 94],
      [6, 34, 62, 98],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 30, 54, 82, 106],
      [6, 30, 54, 86, 110],
      [6, 34, 62, 90, 114],
      [6, 30, 54, 78, 126],
      [6, 34, 62, 90, 122],
      [6, 30, 54, 86, 118],
      [6, 34, 62, 90, 110],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 30, 54, 82, 106, 130],
      [6, 30, 54, 86, 110, 134],
      [6, 34, 62, 90, 114, 138],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 34, 62, 90, 114, 138, 162],
      [6, 30, 54, 86, 110, 134, 158],
      [6, 34, 62, 90, 114, 138, 162],
      [6, 34, 62, 90, 114, 138, 162],
      [6, 34, 62, 90, 114, 138, 162],
      [6, 34, 62, 90, 114, 138, 162],
      [6, 34, 62, 90, 114, 138, 162],
    ]

    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0)
    var G18 =
      (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0)
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

    var _this = {}

    var getBCHDigit = function (data) {
      var digit = 0
      while (data != 0) {
        digit += 1
        data >>>= 1
      }
      return digit
    }

    _this.getBCHTypeInfo = function (data) {
      var d = data << 10
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= G15 << (getBCHDigit(d) - getBCHDigit(G15))
      }
      return ((data << 10) | d) ^ G15_MASK
    }

    _this.getBCHTypeNumber = function (data) {
      var d = data << 12
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= G18 << (getBCHDigit(d) - getBCHDigit(G18))
      }
      return (data << 12) | d
    }

    _this.getPatternPosition = function (typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1]
    }

    _this.getMaskFunction = function (maskPattern) {
      switch (maskPattern) {
        case 0:
          return function (row, col) {
            return (row + col) % 2 == 0
          }
        case 1:
          return function (row, col) {
            return row % 2 == 0
          }
        case 2:
          return function (row, col) {
            return col % 3 == 0
          }
        case 3:
          return function (row, col) {
            return (row + col) % 3 == 0
          }
        case 4:
          return function (row, col) {
            return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 == 0
          }
        case 5:
          return function (row, col) {
            return ((row * col) % 2) + ((row * col) % 3) == 0
          }
        case 6:
          return function (row, col) {
            return (((row * col) % 2) + ((row * col) % 3)) % 2 == 0
          }
        case 7:
          return function (row, col) {
            return (((row * col) % 3) + ((row + col) % 2)) % 2 == 0
          }
        default:
          throw new Error('bad maskPattern:' + maskPattern)
      }
    }

    _this.getErrorCorrectPolynomial = function (errorCorrectLength) {
      var a = qrPolynomial([1], 0)
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0))
      }
      return a
    }

    _this.getLengthInBits = function (mode, type) {
      if (1 <= type && type < 10) {
        // 1 - 9
        if (mode == 4) {
          // 8bit byte
          return 8
        }
      } else if (type < 27) {
        // 10 - 26
        if (mode == 4) {
          // 8bit byte
          return 16
        }
      } else if (type < 42) {
        // 27 - 40
        if (mode == 4) {
          // 8bit byte
          return 16
        }
      } else {
        throw new Error('type:' + type)
      }

      throw new Error('mode:' + mode)
    }

    _this.getLostPoint = function (qrcode) {
      var moduleCount = qrcode.getModuleCount()

      var lostPoint = 0

      // LEVEL1
      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {
          var sameCount = 0
          var dark = qrcode.isDark(row, col)

          for (var r = -1; r <= 1; r += 1) {
            if (row + r < 0 || moduleCount <= row + r) {
              continue
            }

            for (var c = -1; c <= 1; c += 1) {
              if (col + c < 0 || moduleCount <= col + c) {
                continue
              }

              if (r == 0 && c == 0) {
                continue
              }

              if (dark == qrcode.isDark(row + r, col + c)) {
                sameCount += 1
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += 3 + sameCount - 5
          }
        }
      }

      // LEVEL2
      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0
          if (qrcode.isDark(row, col)) count += 1
          if (qrcode.isDark(row + 1, col)) count += 1
          if (qrcode.isDark(row, col + 1)) count += 1
          if (qrcode.isDark(row + 1, col + 1)) count += 1
          if (count == 0 || count == 4) {
            lostPoint += 3
          }
        }
      }

      // LEVEL3
      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (
            qrcode.isDark(row, col) &&
            !qrcode.isDark(row, col + 1) &&
            qrcode.isDark(row, col + 2) &&
            qrcode.isDark(row, col + 3) &&
            qrcode.isDark(row, col + 4) &&
            !qrcode.isDark(row, col + 5) &&
            qrcode.isDark(row, col + 6)
          ) {
            lostPoint += 40
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (
            qrcode.isDark(row, col) &&
            !qrcode.isDark(row + 1, col) &&
            qrcode.isDark(row + 2, col) &&
            qrcode.isDark(row + 3, col) &&
            qrcode.isDark(row + 4, col) &&
            !qrcode.isDark(row + 5, col) &&
            qrcode.isDark(row + 6, col)
          ) {
            lostPoint += 40
          }
        }
      }

      // LEVEL4
      var darkCount = 0

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col)) {
            darkCount += 1
          }
        }
      }

      var ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5
      lostPoint += ratio * 10

      return lostPoint
    }

    return _this
  })()

  return qrcode
})()

// Cria um aviso para o Alex no painel (coleção activities) sobre um evento da proposta
function createProposalAlert(quoteRecord, quoteNumber, title, description, priority) {
  try {
    const col = $app.findCollectionByNameOrId('activities')
    const rec = new Record(col)
    rec.set('title', title)
    rec.set('client_id', quoteRecord.getString('client_id') || '')
    rec.set(
      'client_name',
      quoteRecord.getString('client_name') || quoteRecord.get('client_name') || 'Cliente',
    )
    rec.set('type', 'proposal_alert')
    rec.set('priority', priority || 'high')
    rec.set('status', 'pending')
    rec.set('description', description)
    rec.set('assigned_to', quoteRecord.get('assigned_to') || 'Alex Nogueira')
    $app.save(rec)
  } catch (err) {
    console.warn('[Proposal Alert] Falha ao criar aviso no painel:', err)
  }
}

routerAdd('GET', '/backend/v1/public/proposals/{token}', (c) => {
  const token = c.request.pathValue('token')
  if (!token || token.trim() === '') {
    return c.json(400, { success: false, error: 'Token inválido ou não fornecido.' })
  }

  let quoteRecord = null
  try {
    const quotes = $app.findRecordsByFilter(
      'quotes',
      `approval_token = "${token}" || id = "${token}" || code = "${token}" || quote_number = "${token}"`,
      '-created',
      1,
      0,
    )
    if (quotes && quotes.length > 0) {
      quoteRecord = quotes[0]
    }
  } catch (err) {
    console.error('Erro ao buscar proposta pública:', err)
  }

  if (!quoteRecord) {
    return c.json(404, { success: false, error: 'Proposta não encontrada para o token fornecido.' })
  }

  // Tentar buscar cliente
  let clientRecord = null
  const clientId = quoteRecord.get('client_id')
  if (clientId) {
    try {
      clientRecord = $app.findRecordById('clients', clientId)
    } catch (_) {}
  }

  // Retornar apenas os dados públicos relevantes para a visão do cliente (sem expor composição interna gerencial)
  const data = {
    id: quoteRecord.id,
    code: quoteRecord.get('code') || quoteRecord.get('quote_number'),
    quote_number: quoteRecord.get('quote_number') || quoteRecord.get('code'),
    status: quoteRecord.get('status'),
    title: quoteRecord.get('title'),
    client_name:
      quoteRecord.get('client_name') ||
      (clientRecord ? clientRecord.get('name') || clientRecord.get('company_name') : 'Cliente'),
    client_document: clientRecord
      ? clientRecord.get('document')
      : quoteRecord.get('client_document'),
    assigned_to: quoteRecord.get('assigned_to') || 'Alex Nogueira - Especialista Técnico',
    created: quoteRecord.get('created'),
    validity_days: quoteRecord.get('validity_days') || 10,
    payment_terms:
      quoteRecord.get('payment_terms') || quoteRecord.get('payment_conditions') || '28 DDL',
    scope_of_work: quoteRecord.get('scope_of_work') || quoteRecord.get('notes') || '',
    equipment_brand: quoteRecord.get('equipment_brand') || 'BERMO',
    equipment_model: quoteRecord.get('equipment_model') || '',
    equipment_quantity: quoteRecord.get('equipment_quantity') || 1,
    plate_count: quoteRecord.get('plate_count'),
    plate_material: quoteRecord.get('plate_material'),
    plate_thickness: quoteRecord.get('plate_thickness'),
    gasket_material: quoteRecord.get('gasket_material'),
    connection_size: quoteRecord.get('connection_size'),
    connection_type: quoteRecord.get('connection_type'),
    pressure_test_bar: quoteRecord.get('pressure_test_bar'),
    working_pressure_bar: quoteRecord.get('working_pressure_bar'),
    dimensions_w_h_d: quoteRecord.get('dimensions_w_h_d'),
    weight_kg: quoteRecord.get('weight_kg'),
    work_fluid: quoteRecord.get('work_fluid'),
    custom_work_fluid: quoteRecord.get('custom_work_fluid'),
    total: quoteRecord.get('final_price') || quoteRecord.get('total') || 0,
    final_price: quoteRecord.get('final_price') || quoteRecord.get('total') || 0,
    subtotal: quoteRecord.get('subtotal') || quoteRecord.get('total') || 0,
    commercial_notes: quoteRecord.get('commercial_notes') || '',
    notes: quoteRecord.get('notes') || '',
    items: quoteRecord.get('items') || [],
    equipments: quoteRecord.get('equipments') || [],
    service_details: quoteRecord.get('service_details') || null,
    approval_token: quoteRecord.get('approval_token'),
    approved_by_client_name: quoteRecord.get('approved_by_client_name'),
    approved_by_client_date: quoteRecord.get('approved_by_client_date'),
    rejected_by_client_reason: quoteRecord.get('rejected_by_client_reason'),
    rejected_by_client_date: quoteRecord.get('rejected_by_client_date'),
  }

  // Aviso no painel: cliente ABRIU a proposta (idempotente por dia — evita spam de avisos)
  try {
    const quoteNumberOpen =
      quoteRecord.get('quote_number') || quoteRecord.get('code') || quoteRecord.id
    const today = new Date().toISOString().slice(0, 10)
    const marker = 'abertura-' + quoteRecord.id + '-' + today
    const existing = $app.findRecordsByFilter(
      'activities',
      'description ~ "' + marker + '"',
      '-created',
      1,
      0,
    )
    if (!existing || existing.length === 0) {
      createProposalAlert(
        quoteRecord,
        quoteNumberOpen,
        'Proposta #' + quoteNumberOpen + ' aberta pelo cliente',
        marker + ' — O cliente acessou a proposta online hoje.',
        'medium',
      )
    }
  } catch (openErr) {
    console.warn('[Proposal Alert] Falha no aviso de abertura:', openErr)
  }

  return c.json(200, { success: true, quote: data })
})

routerAdd('POST', '/backend/v1/public/proposals/{token}/action', (c) => {
  const token = c.request.pathValue('token')
  const reqInfo =
    typeof $apis !== 'undefined' && $apis.requestInfo ? $apis.requestInfo(c) : c.requestInfo()
  const body = reqInfo.data || reqInfo.body || {}
  const action = String(body.action || '')
    .trim()
    .toLowerCase() // 'approve' | 'reject'
  const clientApproverName = String(body.client_name || body.name || '').trim()
  const rejectReason = String(body.reason || body.rejection_reason || '').trim()

  if (!token || token.trim() === '') {
    return c.json(400, { success: false, error: 'Token inválido.' })
  }

  if (action !== 'approve' && action !== 'reject') {
    return c.json(400, {
      success: false,
      error: 'Ação inválida. Use action="approve" ou action="reject".',
    })
  }

  if (action === 'approve' && !clientApproverName) {
    return c.json(400, {
      success: false,
      error: 'Por favor, informe seu nome completo para registrar o aceite digital.',
    })
  }

  let quoteRecord = null
  try {
    const quotes = $app.findRecordsByFilter(
      'quotes',
      `approval_token = "${token}" || id = "${token}" || code = "${token}" || quote_number = "${token}"`,
      '-created',
      1,
      0,
    )
    if (quotes && quotes.length > 0) {
      quoteRecord = quotes[0]
    }
  } catch (err) {
    console.error('Erro ao buscar proposta:', err)
  }

  if (!quoteRecord) {
    return c.json(404, { success: false, error: 'Proposta não encontrada.' })
  }

  const nowIso = new Date().toISOString()
  const quoteNumber = quoteRecord.get('quote_number') || quoteRecord.get('code') || quoteRecord.id

  if (action === 'approve') {
    quoteRecord.set('status', 'approved')
    quoteRecord.set('approved_by_client_name', clientApproverName)
    quoteRecord.set('approved_by_client_date', nowIso)
    $app.save(quoteRecord)

    // Aviso no painel: proposta APROVADA pelo cliente
    createProposalAlert(
      quoteRecord,
      quoteNumber,
      'Proposta #' + quoteNumber + ' APROVADA pelo cliente',
      'Aprovada digitalmente por ' +
        clientApproverName +
        ' em ' +
        new Date().toLocaleString('pt-BR') +
        '. OS gerada automaticamente.',
      'urgent',
    )

    // SINCRONIZAR AUTOMATICAMENTE COM O PIPELINE COMERCIAL (Estágio 'won')
    try {
      let dealRecord = null
      const dealId = quoteRecord.getString('deal_id')
      if (dealId) {
        try {
          dealRecord = $app.findFirstRecordByData('deals', 'id', dealId)
        } catch (_) {}
      }
      if (!dealRecord) {
        try {
          const listDeals = $app.findRecordsByFilter(
            'deals',
            `title ~ "${quoteNumber}" || notes ~ "${quoteNumber}"`,
            '-updated,-created',
            5,
            0,
          )
          if (listDeals && listDeals.length > 0) {
            dealRecord = listDeals[0]
          }
        } catch (_) {}
      }

      const clientNameStr = quoteRecord.getString('client_name') || 'Cliente'
      const dealTitleStr = `Proposta ${quoteNumber} — ${clientNameStr}`
      let dealVal = quoteRecord.getFloat('total')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('final_price')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('subtotal')
      if (!dealVal || dealVal <= 0) dealVal = 0

      if (dealRecord) {
        // Movimento manual nunca é desfeito: se o negócio já está em won/lost, não reverter
        const currentStage = dealRecord.getString('stage')
        if (currentStage !== 'won' && currentStage !== 'lost') {
          dealRecord.set('stage', 'won')
          dealRecord.set('probability', 100)
        }
        dealRecord.set('value', dealVal)
        dealRecord.set(
          'notes',
          `Proposta #${quoteNumber} APROVADA digitalmente pelo cliente (${clientApproverName}).`,
        )
        $app.save(dealRecord)
        if (quoteRecord.getString('deal_id') !== dealRecord.id) {
          quoteRecord.set('deal_id', dealRecord.id)
          $app.save(quoteRecord)
        }
      } else {
        const dealsCol = $app.findCollectionByNameOrId('deals')
        const newDeal = new Record(dealsCol)
        newDeal.set('title', dealTitleStr)
        newDeal.set('client_id', quoteRecord.getString('client_id') || '')
        newDeal.set('client_name', clientNameStr)
        newDeal.set('value', dealVal)
        newDeal.set('stage', 'won')
        newDeal.set('probability', 100)
        newDeal.set('priority', 'urgent')
        newDeal.set('assigned_to', quoteRecord.getString('assigned_to') || 'Alex Nogueira')
        newDeal.set(
          'notes',
          `Proposta #${quoteNumber} APROVADA digitalmente pelo cliente (${clientApproverName}).`,
        )
        $app.save(newDeal)
        quoteRecord.set('deal_id', newDeal.id)
        $app.save(quoteRecord)
      }
    } catch (dealErr) {
      console.warn('Erro ao sincronizar deal na aprovação pública:', dealErr)
    }

    // Tentar disparar e-mail completo de aprovação chamando a rota de notificação com anexo de PDF
    try {
      let appSiteUrl = ''
      try {
        appSiteUrl = $os.getenv('SITE_URL') || $os.getenv('PB_INSTANCE_URL') || ''
      } catch (_) {
        appSiteUrl = ''
      }
      if (!appSiteUrl) appSiteUrl = 'https://intertermal.goskip.app'
      if (appSiteUrl.endsWith('/')) appSiteUrl = appSiteUrl.slice(0, -1)

      const pdfFileName = quoteRecord.getString('pdf_file') || ''
      let pdfDownloadUrl = ''
      if (pdfFileName) {
        pdfDownloadUrl =
          appSiteUrl +
          '/api/files/' +
          quoteRecord.collection().id +
          '/' +
          quoteRecord.id +
          '/' +
          pdfFileName
      }

      // QR code do link de aprovação para o rodapé do e-mail de aceite
      let approvalQrSvg = ''
      try {
        const approvalLinkForQr =
          appSiteUrl + '/aprovar/' + (quoteRecord.getString('approval_token') || quoteRecord.id)
        const qr = qrcode(0, 'M')
        qr.addData(approvalLinkForQr)
        qr.make()
        approvalQrSvg = qr.createSvgTag({ cellSize: 3, margin: 2 })
      } catch (qrErr) {
        console.warn('Falha ao gerar QR code do aceite:', qrErr)
      }

      const mailClient =
        typeof $app !== 'undefined' && $app.newMailClient ? $app.newMailClient() : null
      if (mailClient) {
        let pdfAttachmentSection = ''
        if (pdfDownloadUrl) {
          pdfAttachmentSection = `<div style="background-color:#f0fdf4; border:2px solid #10b981; border-radius:8px; padding:16px 20px; margin:20px 0;">
            <strong style="font-size:14px; color:#166534; display:block;">PDF Oficial da Proposta Anexado (Visão Cliente + Composição Interna)</strong>
            <p style="font-size:12px; color:#15803d; margin:4px 0 10px 0;">O documento técnico completo com composição interna foi anexado a este e-mail.</p>
            <a href="${pdfDownloadUrl}" target="_blank" style="display:inline-block; background-color:#059669; color:#ffffff; text-decoration:none; font-weight:700; font-size:12px; padding:8px 18px; border-radius:6px;">Baixar PDF Oficial</a>
          </div>`
        }

        const msg = new MailerMessage({
          from: {
            address: 'alex.nogueira@intertermal.com.br',
            name: 'Intertermal - Notificações',
          },
          to: [{ address: 'alex.nogueira@intertermal.com.br' }],
          subject: `[ACEITE CONFIRMADO] Proposta #${quoteNumber} Aprovada pelo Cliente (${clientApproverName})`,
          html: `<div style="font-family:sans-serif; max-width:640px; margin:0 auto; padding:24px; color:#1e293b; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px;">
            <div style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding:20px; color:#ffffff; border-radius:8px; margin-bottom:20px;">
              <h2 style="margin:0 0 6px 0; font-size:20px;">INTERTERMAL • ACEITE CONFIRMADO</h2>
              <p style="margin:0; font-size:14px; opacity:0.9;">Aprovação Digital realizada pelo cliente</p>
            </div>
            <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:12px 16px; margin-bottom:18px;">
              <div style="font-size:14px; font-weight:700; color:#166534;">Aceite Digital Concluído</div>
              <div style="font-size:13px; color:#15803d;">A proposta técnica #${quoteNumber} para <strong>${quoteRecord.getString('client_name') || 'Cliente'}</strong> foi aprovada por <strong>${clientApproverName}</strong> em ${new Date().toLocaleString('pt-BR')}.</div>
            </div>
            ${pdfAttachmentSection}
            <p style="font-size:13px; color:#475569;">A Ordem de Serviço correspondente foi gerada automaticamente e enviada para o Pipeline de Execução Técnica.</p>
            <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; text-align:center;">
              <div style="display:inline-block; padding:10px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px;">${approvalQrSvg}</div>
              <p style="margin:8px 0 4px 0; font-size:11px; color:#475569;">Aponte a câmera para o QR code para abrir a proposta:</p>
              <p style="margin:0; font-size:11px; word-break:break-all;"><a href="${appSiteUrl}/aprovar/${quoteRecord.getString('approval_token') || quoteRecord.id}" style="color:#0284c7;">${appSiteUrl}/aprovar/${quoteRecord.getString('approval_token') || quoteRecord.id}</a></p>
            </div>
            <div style="margin-top:16px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center;">
              INTERTERMAL - SOLUÇÕES TÉRMICAS INDUSTRIAIS • alex.nogueira@intertermal.com.br
            </div>
          </div>`,
          attachments: {},
        })

        let fsInst = null
        let pdfRdr = null
        if (pdfFileName) {
          try {
            fsInst = $app.newFilesystem()
            const fKey = quoteRecord.baseFilesPath() + '/' + pdfFileName
            if (fsInst.exists(fKey)) {
              pdfRdr = fsInst.getReader(fKey)
              const attachName = 'Proposta_' + quoteNumber.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf'
              msg.attachments[attachName] = pdfRdr
            }
          } catch (attErr) {
            console.warn('Erro ao anexar arquivo no e-mail de aprovação pública:', attErr)
          }
        }

        try {
          mailClient.send(msg)
        } finally {
          try {
            if (pdfRdr && typeof pdfRdr.close === 'function') pdfRdr.close()
          } catch (_) {}
          try {
            if (fsInst && typeof fsInst.close === 'function') fsInst.close()
          } catch (_) {}
        }
      }
    } catch (mailErr) {
      console.warn('Erro no envio do e-mail de confirmação de aceite público:', mailErr)
    }

    return c.json(200, {
      success: true,
      action: 'approved',
      message: `Proposta #${quoteNumber} aprovada com sucesso por ${clientApproverName}! Ordem de Serviço emitida no sistema.`,
      approved_by: clientApproverName,
      approved_at: nowIso,
      service_order_id: createdServiceOrder ? createdServiceOrder.id : null,
    })
  } else {
    // REJECT
    quoteRecord.set('status', 'rejected')
    quoteRecord.set('rejected_by_client_reason', rejectReason || 'Sem motivo especificado')
    quoteRecord.set('rejected_by_client_date', nowIso)
    $app.save(quoteRecord)

    // Aviso no painel: proposta RECUSADA pelo cliente
    createProposalAlert(
      quoteRecord,
      quoteNumber,
      'Proposta #' + quoteNumber + ' RECUSADA pelo cliente',
      'Motivo informado: ' +
        (rejectReason || 'Sem motivo especificado') +
        ' — em ' +
        new Date().toLocaleString('pt-BR') +
        '.',
      'urgent',
    )

    // SINCRONIZAR AUTOMATICAMENTE COM O PIPELINE COMERCIAL (Estágio 'lost')
    try {
      let dealRecord = null
      const dealId = quoteRecord.getString('deal_id')
      if (dealId) {
        try {
          dealRecord = $app.findFirstRecordByData('deals', 'id', dealId)
        } catch (_) {}
      }
      if (!dealRecord) {
        try {
          const listDeals = $app.findRecordsByFilter(
            'deals',
            `title ~ "${quoteNumber}" || notes ~ "${quoteNumber}"`,
            '-updated,-created',
            5,
            0,
          )
          if (listDeals && listDeals.length > 0) {
            dealRecord = listDeals[0]
          }
        } catch (_) {}
      }

      const clientNameStr = quoteRecord.getString('client_name') || 'Cliente'
      const dealTitleStr = `Proposta ${quoteNumber} — ${clientNameStr}`
      let dealVal = quoteRecord.getFloat('total')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('final_price')
      if (!dealVal || dealVal <= 0) dealVal = quoteRecord.getFloat('subtotal')
      if (!dealVal || dealVal <= 0) dealVal = 0

      if (dealRecord) {
        // Movimento manual nunca é desfeito: se o negócio já está em won/lost, não reverter
        const currentStage = dealRecord.getString('stage')
        if (currentStage !== 'won' && currentStage !== 'lost') {
          dealRecord.set('stage', 'lost')
          dealRecord.set('probability', 0)
        }
        dealRecord.set('value', dealVal)
        dealRecord.set('loss_reason', rejectReason || 'Recusada pelo cliente')
        dealRecord.set(
          'notes',
          `Proposta #${quoteNumber} recusada pelo cliente: "${rejectReason || 'Sem motivo especificado'}".`,
        )
        $app.save(dealRecord)
        if (quoteRecord.getString('deal_id') !== dealRecord.id) {
          quoteRecord.set('deal_id', dealRecord.id)
          $app.save(quoteRecord)
        }
      } else {
        const dealsCol = $app.findCollectionByNameOrId('deals')
        const newDeal = new Record(dealsCol)
        newDeal.set('title', dealTitleStr)
        newDeal.set('client_id', quoteRecord.getString('client_id') || '')
        newDeal.set('client_name', clientNameStr)
        newDeal.set('value', dealVal)
        newDeal.set('stage', 'lost')
        newDeal.set('probability', 0)
        newDeal.set('loss_reason', rejectReason || 'Recusada pelo cliente')
        newDeal.set('priority', 'medium')
        newDeal.set('assigned_to', quoteRecord.getString('assigned_to') || 'Alex Nogueira')
        newDeal.set(
          'notes',
          `Proposta #${quoteNumber} recusada pelo cliente: "${rejectReason || 'Sem motivo especificado'}".`,
        )
        $app.save(newDeal)
        quoteRecord.set('deal_id', newDeal.id)
        $app.save(quoteRecord)
      }
    } catch (dealErr) {
      console.warn('Erro ao sincronizar deal na recusa pública:', dealErr)
    }

    return c.json(200, {
      success: true,
      action: 'rejected',
      message: `Proposta #${quoteNumber} marcada como reprovada. A equipe técnica entrará em contato para ajustes.`,
      rejected_at: nowIso,
    })
  }
})

// QR code do link de aprovação (SVG) — usado no rodapé do PDF da proposta
routerAdd('GET', '/backend/v1/public/proposals/{token}/qr', (c) => {
  const token = c.request.pathValue('token')
  if (!token || token.trim() === '') {
    return c.json(400, { success: false, error: 'Token inválido.' })
  }
  let quoteRecord = null
  try {
    const quotes = $app.findRecordsByFilter(
      'quotes',
      `approval_token = "${token}" || id = "${token}" || code = "${token}" || quote_number = "${token}"`,
      '-created',
      1,
      0,
    )
    if (quotes && quotes.length > 0) quoteRecord = quotes[0]
  } catch (err) {
    console.error('Erro ao buscar proposta para QR:', err)
  }
  if (!quoteRecord) {
    return c.json(404, { success: false, error: 'Proposta não encontrada.' })
  }
  let appUrl = ''
  try {
    appUrl = $os.getenv('SITE_URL') || $os.getenv('PB_INSTANCE_URL') || ''
  } catch (_) {
    appUrl = ''
  }
  if (!appUrl) appUrl = 'https://intertermal.goskip.app'
  if (appUrl.endsWith('/')) appUrl = appUrl.slice(0, -1)
  const link = appUrl + '/aprovar/' + (quoteRecord.getString('approval_token') || quoteRecord.id)
  let svg = ''
  try {
    const qr = qrcode(0, 'M')
    qr.addData(link)
    qr.make()
    svg = qr.createSvgTag({ cellSize: 4, margin: 2 })
  } catch (qrErr) {
    return c.json(500, { success: false, error: 'Falha ao gerar QR code: ' + qrErr })
  }
  return c.json(200, { success: true, svg: svg, link: link })
})
