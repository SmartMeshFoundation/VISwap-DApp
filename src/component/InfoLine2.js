import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import * as Mui from '@material-ui/core';

export default function InfoLine2(props) {

  return (
    <Mui.Grid container alignItems="center" justifyContent="space-between" mb={1}>
      <Mui.Grid item mr={2}>
        <Mui.Typography variant="body2" component="div">
          {props.name}{props.tooltip &&
            <Tooltip placement="top" title={props.tooltip}>
              <IconButton size="small">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        </Mui.Typography>
      </Mui.Grid>
      <Mui.Grid item container width="auto"  alignItems="right" wrap="nowrap">
        <Mui.Grid item flexShrink={0}>
          <Mui.Typography noWrap variant="body2" component="div">
            {props.value}
          </Mui.Typography>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.Grid>
  )
}