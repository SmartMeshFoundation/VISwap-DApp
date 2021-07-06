import { Link, Redirect, NavLink, useLocation } from "react-router-dom";
import { forwardRef } from 'react'

export function useQuery(name, defaultValue) {
    return new URLSearchParams(useLocation().search).get(name) || defaultValue;
}

const wrapped = (Component) => forwardRef((props, ref) => {
    const location = useLocation()
    const { host, pathname, search } = new URL(props.to, window.location)
    const to = host === window.location.host ? `${pathname}${search || location.search}` : props.to
    return <Component {...props} to={to} ref={ref} />
})

const WrappedLink = wrapped(Link)
const WrappedRedirect = wrapped(Redirect)
const WrappedNavLink = wrapped(NavLink)

export { WrappedLink as Link, WrappedNavLink as NavLink, WrappedRedirect as Redirect}