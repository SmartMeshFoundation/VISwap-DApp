import { useIntl } from 'react-intl';
import { useTokenSelectionDispatch } from './TokenSelection'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as Mui from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import HT from '../assets/ht.png'
import WHT from '../assets/wht.png'
import VIT from '../assets/vit.png'
import USDT from '../assets/usdt.png'
import DEFAULT from '../assets/default.png'


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  small: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
  large: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
}));

function getImg(displayName){
  switch(displayName){
      case "HT":
      return HT;
      case "WHT":
      return WHT;
      case "VIT":
      return VIT; 
      case "USDT":
      return USDT; 
      default:
      return DEFAULT;
  }
}
export default function TokenInput(props) {
  const { token: { displayName, address }, title, balance, isToken0, dispatch, amount, hideMax, disabled } = props
  const tokenSelectionDispatch = useTokenSelectionDispatch()
  const intl = useIntl()
  const classes = useStyles();
  const re = /([0-9]+\.[0-9]{6})[0-9]*/;
  return (
    <>
      <Mui.TextField
        label={title}
        type="text"
        size="small"
        margin="normal"
        value={amount}
        onChange={(e) => dispatch({
          type: 'amount_changed',
          value: /^\d*\.?\d*$/.test(e.target.value) ? e.target.value : amount,
          address
        })}
        helperText={balance && intl.formatMessage({ defaultMessage: 'Balance: {balance}' }, { balance: balance.toFixed().replace(re,"$1") })}
        fullWidth
        disabled={disabled}
        sx={{ mt: 1 }}
        InputProps={{
          startAdornment: <Mui.InputAdornment position="start">
            <Mui.Button style={{textTransform: 'none'}} size="small" startIcon={displayName && <Mui.Avatar src= {getImg(displayName)} className={classes.small} />}  onClick={() => tokenSelectionDispatch({ type: 'open', isToken0 })} >
              {displayName || intl.formatMessage({ defaultMessage: 'Select Token' })}
              <ExpandMoreIcon />
            </Mui.Button>
          </Mui.InputAdornment>,
          endAdornment: balance && !hideMax && <Mui.InputAdornment position="end">
            <Mui.Button style={{textTransform: 'none'}}  sx={{ mr: '-12px' }} size="small" onClick={() => dispatch({ type: 'amount_changed', value: balance.toFixed().replace(re,"$1"), address })} >
              {intl.formatMessage({ defaultMessage: 'Max' })}
            </Mui.Button>
          </Mui.InputAdornment>
        }}
        FormHelperTextProps={{
          sx: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }
        }}
      />
    </>
  )
}
