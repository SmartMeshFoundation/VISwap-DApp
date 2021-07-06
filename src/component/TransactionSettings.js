import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import { useIntl } from 'react-intl'
import { useState, useContext, createContext } from 'react'
import * as Mui from '@material-ui/core';
import { BigNumber } from './utils';

const _defaultSlippage = '5'
const _defaultDeadline = '20'
const _defaultMaxHops = '2'

const TransactionSettingsContext = createContext()

export const useTransactionSettings = () => useContext(TransactionSettingsContext)

export function TransactionSettingsProvider(props) {
  const defaultSlippage = props.defaultSlippage || _defaultSlippage
  const defaultDeadline = props.defaultDeadline || _defaultDeadline
  const defaultMaxHops = props.defaultMaxHops || _defaultMaxHops
  const [slippage, setSlippage] = useState(defaultSlippage)
  const [deadline, setDeadline] = useState(defaultDeadline)
  const [maxHops, setMaxHops] = useState(defaultMaxHops)

  return (
    <TransactionSettingsContext.Provider value={{
      slippage, setSlippage, defaultSlippage, getMinOutput: (amount) => new BigNumber(slippage || defaultSlippage).shiftedBy(-2).negated().plus(1).times(amount),
      deadline, setDeadline, defaultDeadline, getDeadline: () => new BigNumber(new Date().getTime()).shiftedBy(-3).plus(new BigNumber(deadline || defaultDeadline).times(60)).toFixed(0),
      maxHops, setMaxHops, defaultMaxHops, getMaxHops: () => maxHops || defaultMaxHops
    }}>
      {props.children}
    </TransactionSettingsContext.Provider>
  )
}

export default function TransactionSettings({ showMaxHops }) {
  const {
    slippage, setSlippage, defaultSlippage,
    deadline, setDeadline, defaultDeadline,
    maxHops, setMaxHops, defaultMaxHops
  } = useTransactionSettings()
  const [anchorEl, setAnchorEl] = useState(null);

  const intl = useIntl()
  return (
    <div>
      <Mui.IconButton onClick={(event) => setAnchorEl(anchorEl ? null : event.currentTarget)}>
        <SettingsIcon />
      </Mui.IconButton>
      <Mui.Popover
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        sx={{ '& .MuiPopover-paper': { width: 240 } }}
      >
        <Mui.DialogTitle>{intl.formatMessage({ defaultMessage: 'Transaction Settings' })}</Mui.DialogTitle>
        <Mui.DialogContent>
          <Mui.Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Mui.Grid item>
              <Mui.TextField
                margin="dense"
                label={intl.formatMessage({ defaultMessage: 'Slippage tolerance' })}
                inputProps={{ inputMode: 'decimal' }}
                value={slippage}
                onChange={(e) => setSlippage(
                  /^\d*\.?\d*$/.test(e.target.value) ? (parseFloat(e.target.value) > 100 ? '100' : e.target.value) : slippage
                )}
                placeholder={defaultSlippage}
                size="small"
                InputProps={{
                  endAdornment: <Mui.InputAdornment position="end">%</Mui.InputAdornment>,
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Mui.Grid>
            <Mui.Grid item>
              <Mui.Tooltip placement="bottom" title={intl.formatMessage({ defaultMessage: 'Your transaction will revert if the price changes unfavorably by more than this percentage.' })}>
                <Mui.IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </Mui.IconButton>
              </Mui.Tooltip>
            </Mui.Grid>
          </Mui.Grid>
          <Mui.Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Mui.Grid item>
              <Mui.TextField
                margin="dense"
                label={intl.formatMessage({ defaultMessage: 'Transaction deadline' })}
                inputProps={{ inputMode: 'decimal' }}
                value={deadline}
                onChange={(e) => setDeadline(
                  /^\d*\.?\d*$/.test(e.target.value) ? e.target.value : deadline
                )}
                placeholder={defaultDeadline}
                size="small"
                InputProps={{
                  endAdornment: <Mui.InputAdornment position="end">{intl.formatMessage({ defaultMessage: 'mins' })}</Mui.InputAdornment>,
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Mui.Grid>
            <Mui.Grid item>
              <Mui.Tooltip placement="bottom" title={intl.formatMessage({ defaultMessage: 'Your transaction will revert if it is pending for more than this long.' })}>
                <Mui.IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </Mui.IconButton>
              </Mui.Tooltip>
            </Mui.Grid>
          </Mui.Grid>
          {showMaxHops &&
            <Mui.Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
              <Mui.Grid item>
                <Mui.TextField
                  margin="dense"
                  label={intl.formatMessage({ defaultMessage: 'Maximum hops' })}
                  inputProps={{ inputMode: 'numeric' }}
                  value={maxHops}
                  onChange={(e) => setMaxHops(
                    /^\d*$/.test(e.target.value) ? (parseInt(e.target.value) > 0 ? parseInt(e.target.value) : '') : maxHops
                  )}
                  placeholder={defaultMaxHops}
                  size="small"
                  InputProps={{
                    endAdornment: <Mui.InputAdornment position="end">{intl.formatMessage({ defaultMessage: 'pairs' })}</Mui.InputAdornment>,
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Mui.Grid>
              <Mui.Grid item>
                <Mui.Tooltip placement="bottom" title={intl.formatMessage({ defaultMessage: 'The maximum pair number allowed in a transaction when searching the best trade route.' })}>
                  <Mui.IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </Mui.IconButton>
                </Mui.Tooltip>
              </Mui.Grid>
            </Mui.Grid>
          }
        </Mui.DialogContent>
      </Mui.Popover>
    </div>
  )
}