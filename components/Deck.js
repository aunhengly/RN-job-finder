import React, { Component } from 'react'
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native'
import styled from 'styled-components/native'

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH
const SWIPE_OUT_DURATION = 250

class Deck extends Component {
  static defaultProps = {
    onSwipeLeft: () => {},
    onSwipeRight: () => {}
  }

  state = {
    index: 0
  }

  componentWillMount() {
    const position = new Animated.ValueXY()
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left')
        } else {
          this.resetPosition()
        }
      }
    })
    this.position = position
  }

  componentWillUpdate() {
    // Handle animation for Android
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true)
    LayoutAnimation.spring()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 })
    }
  }

  forceSwipe(direction) {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH
    Animated.timing(this.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction))
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props
    const item = data[this.state.index]

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item)
    this.position.setValue({ x: 0, y: 0 })
    this.setState({ index: this.state.index + 1 })
  }

  resetPosition() {
    Animated.spring(this.position, { toValue: { x: 0, y: 0 } }).start()
  }

  getCardStyle() {
    const position = this.position
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 2.0, 0, SCREEN_WIDTH * 2.0],
      outputRange: ['-120deg', '0deg', '120deg']
    })

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    }
  }

  renderCards() {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards()
    }

    return this.props.data
      .map((item, i) => {
        if (i < this.state.index) {
          return null
        }
        if (i === this.state.index) {
          return (
            <AnimatedCardStyles
              index={i}
              key={item.id}
              style={[
                this.getCardStyle(),
                { top: 10 * (i - this.state.index) }
              ]}
              {...this.panResponder.panHandlers}
            >
              {this.props.renderCard(item)}
            </AnimatedCardStyles>
          )
        }
        return (
          <AnimatedCardStyles
            index={i}
            key={item.id}
            style={{
              top: 10 * (i - this.state.index)
            }}
          >
            {this.props.renderCard(item)}
          </AnimatedCardStyles>
        )
      })
      .reverse()
  }

  render() {
    return <View>{this.renderCards()}</View>
  }
}

const AnimatedCardStyles = styled(Animated.View)`
  position: absolute;
  width: ${SCREEN_WIDTH};
`

export default Deck
