from lib.processor.processors.fdc import FirstData
from lib.processor.processors.wells import WellsFargo
from lib.processor.processors.paymentech import Paymentech

valid = ['fdc', 'paymentech', 'wells']

index = {
  "fdc" : FirstData,
  "paymentech" : Paymentech,
  "wells" : WellsFargo
}
