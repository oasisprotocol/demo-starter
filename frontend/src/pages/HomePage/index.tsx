import { FC } from 'react'
import { Card } from '../../components/Card'
import classes from './index.module.css'

export const HomePage: FC = () => {
  return (
    <div className={classes.homePage}>
      <Card>
        <h1>Demo starter</h1>
      </Card>
    </div>
  )
}
