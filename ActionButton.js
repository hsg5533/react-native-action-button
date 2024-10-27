import React, {useState, useRef, useEffect} from 'react';
import {StyleSheet, View, Animated, TouchableOpacity} from 'react-native';
import ActionButtonItem from './ActionButtonItem';
import {shadowStyle, alignItemsMap, isAndroid, touchableBackground, DEFAULT_ACTIVE_OPACITY} from './shared';

export default function ActionButton(props) {
  const [active, setActive] = useState(props.active);
  const anim = useRef(new Animated.Value(props.active ? 1 : 0));
  const timeout = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      timeout.current && clearTimeout(timeout.current);
    };
  }, []);
  useEffect(() => {
    if (props.active) {
      Animated.spring(anim.current, {toValue: 1, useNativeDriver: false}).start();
      setActive(true);
    } else {
      props.onReset && props.onReset();
      Animated.spring(anim.current, {toValue: 0, useNativeDriver: false}).start();
      timeout.current = setTimeout(() => {
        setActive(false);
      }, 250);
    }
  }, [props.active]);

  const getOverlayStyles = () => {
    return [
      styles.overlay,
      {
        elevation: props.elevation,
        zIndex: props.zIndex,
        justifyContent: props.verticalOrientation === 'up' ? 'flex-end' : 'flex-start',
      },
    ];
  };

  const renderButtonIcon = () => {
    const {icon, renderIcon, btnOutRangeTxt, buttonTextStyle, buttonText} = props;
    if (renderIcon) {
      return renderIcon(active);
    }
    if (icon) {
      return icon;
    }
    const textColor = buttonTextStyle.color || 'rgba(255,255,255,1)';
    return (
      <Animated.Text
        style={[
          styles.btnText,
          buttonTextStyle,
          {
            color: anim.current.interpolate({
              inputRange: [0, 1],
              outputRange: [textColor, btnOutRangeTxt || textColor],
            }),
          },
        ]}>
        {buttonText}
      </Animated.Text>
    );
  };

  const renderActions = () => {
    const {children, verticalOrientation} = props;
    if (!active) {
      return null;
    }
    let actionButtons = !Array.isArray(children) ? [children] : children;
    actionButtons = actionButtons.filter(actionButton => typeof actionButton === 'object');
    const actionStyle = {
      flex: 1,
      alignSelf: 'stretch',
      justifyContent: verticalOrientation === 'up' ? 'flex-end' : 'flex-start',
      paddingTop: props.verticalOrientation === 'down' ? props.spacing : 0,
      zIndex: props.zIndex,
    };
    return (
      <View style={actionStyle} pointerEvents={'box-none'}>
        {actionButtons.map((item, idx) => (
          <ActionButtonItem
            key={idx}
            anim={anim.current}
            {...props}
            {...item.props}
            parentSize={props.size}
            btnColor={props.btnOutRange}
            onPress={() => {
              if (props.autoInactive) {
                timeout.current = setTimeout(reset, 200);
              }
              item.props.onPress();
            }}
          />
        ))}
      </View>
    );
  };

  const reset = () => {
    if (props.onReset) {
      props.onReset();
    }
    Animated.spring(anim.current, {toValue: 0, useNativeDriver: false}).start();
    timeout.current = setTimeout(() => {
      if (mounted.current) {
        setActive(false);
      }
    }, 250);
  };

  return (
    <View pointerEvents="box-none" style={[getOverlayStyles(), props.style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          getOverlayStyles(),
          {
            backgroundColor: props.bgColor,
            opacity: anim.current.interpolate({
              inputRange: [0, 1],
              outputRange: [0, props.bgOpacity],
            }),
          },
        ]}>
        {props.backdrop}
      </Animated.View>
      <View
        pointerEvents="box-none"
        style={[getOverlayStyles(), {alignItems: alignItemsMap[props.position], paddingVertical: props.offsetY}]}>
        {active && !props.backgroundTappable && (
          <TouchableOpacity activeOpacity={1} style={getOverlayStyles()} onPress={reset} />
        )}
        {props.verticalOrientation === 'up' && props.children && renderActions()}
        <View
          style={[
            isAndroid && props.fixNativeFeedbackRadius
              ? {
                  right: props.offsetX,
                  zIndex: props.zIndex,
                  borderRadius: props.size / 2,
                  width: props.size,
                }
              : {marginHorizontal: props.offsetX, zIndex: props.zIndex},
            !props.hideShadow && shadowStyle,
          ]}>
          <TouchableOpacity
            testID={props.testID}
            accessible={props.accessible}
            accessibilityLabel={props.accessibilityLabel}
            background={touchableBackground(props.nativeFeedbackRippleColor, props.fixNativeFeedbackRadius)}
            activeOpacity={props.activeOpacity}
            onLongPress={props.onLongPress}
            onPress={() => {
              props.onPress();
              if (props.children) {
                if (active) {
                  reset();
                } else {
                  Animated.spring(anim.current, {toValue: 1, useNativeDriver: false}).start();
                  setActive(true);
                }
              }
            }}
            onPressIn={props.onPressIn}
            onPressOut={props.onPressOut}>
            <Animated.View
              style={{
                backgroundColor: anim.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: [props.buttonColor, props.btnOutRange || props.buttonColor],
                }),
                width: props.size,
                height: props.size,
                borderRadius: props.size / 2,
              }}>
              <Animated.View
                style={{
                  width: props.size,
                  height: props.size,
                  borderRadius: props.size / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    {
                      scale: anim.current.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, props.outRangeScale],
                      }),
                    },
                    {
                      rotate: anim.current.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', props.degrees + 'deg'],
                      }),
                    },
                  ],
                }}>
                {renderButtonIcon()}
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>
        {props.verticalOrientation === 'down' && props.children && renderActions()}
      </View>
    </View>
  );
}

ActionButton.Item = ActionButtonItem;

ActionButton.defaultProps = {
  resetToken: null,
  active: false,
  bgColor: 'transparent',
  bgOpacity: 1,
  buttonColor: 'rgba(0,0,0,1)',
  buttonTextStyle: {},
  buttonText: '+',
  spacing: 20,
  outRangeScale: 1,
  autoInactive: true,
  onPress: () => {},
  onPressIn: () => {},
  onPressOn: () => {},
  backdrop: false,
  degrees: 45,
  position: 'right',
  offsetX: 30,
  offsetY: 30,
  size: 56,
  verticalOrientation: 'up',
  backgroundTappable: false,
  useNativeFeedback: true,
  activeOpacity: DEFAULT_ACTIVE_OPACITY,
  fixNativeFeedbackRadius: false,
  nativeFeedbackRippleColor: 'rgba(255,255,255,0.75)',
  testID: undefined,
  accessibilityLabel: undefined,
  accessible: undefined,
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'transparent',
  },
  btnText: {
    marginTop: -4,
    fontSize: 24,
    backgroundColor: 'transparent',
  },
});
