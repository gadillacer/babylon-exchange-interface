import PositionListItem from 'components/PositionListItem'
import React from 'react'

import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    align-items: center;
    display: flex;

    display: grid;
    grid-template-columns: 1fr 1fr;
    & > div:last-child {
      text-align: right;
      margin-right: 12px;
    }
  }
`

const MobileHeader = styled.div`
  font-weight: medium;
  font-size: 16px;
  font-weight: 500;
  padding: 8px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: none;
  }
`

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
}>

export default function PositionList({ positions }: PositionListProps) {
  console.log(positions)
  return (
    <>
      <DesktopHeader>
        <div>
          <span>Your positions</span>
          {positions && ' (' + positions.length + ')'}
        </div>
        <div>
          <span>Price range</span>
        </div>
      </DesktopHeader>
      <MobileHeader>
        <span>Your positions</span>
      </MobileHeader>
      {positions.map((p) => {
        return <PositionListItem key={p.tokenId.toString()} positionDetails={p} />
      })}
    </>
  )
}
