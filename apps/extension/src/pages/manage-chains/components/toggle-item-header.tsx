import React, { FunctionComponent } from "react";
import styled, { useTheme } from "styled-components";
import { ModularChainInfo } from "@keplr-wallet/types";
import { Columns, Column } from "../../../components/column";
import { Box } from "../../../components/box";
import { Gutter } from "../../../components/gutter";
import { Stack } from "../../../components/stack";
import { Subtitle2, Caption1 } from "../../../components/typography";
import { Toggle } from "../../../components/toggle";
import { ChainImageFallback } from "../../../components/image";
import { NativeChainMarkIcon } from "../../../components/icon";
import { ColorPalette } from "../../../styles";
import { ArrowIcon, StackIcon } from "../../main/components/token/grouped";

interface ToggleItemHeaderProps {
  chainInfo: ModularChainInfo;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  disabled?: boolean;
  isNativeChain?: boolean;
  showExpandIcon?: boolean;
  isOpen?: boolean;
  onHeaderClick?: () => void;
  onToggle: (enable: boolean) => void;
}

export const ToggleItemHeader: FunctionComponent<ToggleItemHeaderProps> = ({
  chainInfo,
  title = chainInfo.chainName,
  subtitle,
  enabled,
  disabled,
  isNativeChain,
  showExpandIcon = false,
  isOpen = false,
  onHeaderClick,
  onToggle,
}) => {
  const theme = useTheme();

  return (
    <Styles.Container disabled={disabled} onClick={onHeaderClick}>
      <Columns sum={1} gutter="0.5rem" alignY="center">
        <Styles.ChainImageWrapper>
          <ChainImageFallback chainInfo={chainInfo} size="2rem" />
          <StackIcon />

          {isNativeChain && (
            <Box
              position="absolute"
              style={{ bottom: "-0.125rem", right: "-0.125rem" }}
            >
              <NativeChainMarkIcon
                width="1rem"
                height="1rem"
                color={
                  enabled
                    ? theme.mode === "light"
                      ? ColorPalette["gray-10"]
                      : ColorPalette["gray-550"]
                    : theme.mode === "light"
                    ? ColorPalette.white
                    : ColorPalette["gray-600"]
                }
              />
            </Box>
          )}
        </Styles.ChainImageWrapper>

        <Gutter size="0.75rem" />

        <Stack gutter="0.125rem">
          <Subtitle2
            color={
              theme.mode === "light"
                ? ColorPalette["gray-700"]
                : ColorPalette["gray-10"]
            }
          >
            {title}
          </Subtitle2>
          {subtitle && (
            <Box
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.125rem",
              }}
            >
              <Caption1 color={ColorPalette["gray-300"]}>{subtitle}</Caption1>
              {showExpandIcon && (
                <Styles.ExpandIcon isOpen={isOpen}>
                  <ArrowIcon />
                </Styles.ExpandIcon>
              )}
            </Box>
          )}
        </Stack>

        <Column weight={1} />

        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Toggle
            isOpen={enabled}
            setIsOpen={() => {
              if (!disabled) {
                onToggle(!enabled);
              }
            }}
            disabled={disabled}
            size="large"
          />
        </div>
      </Columns>
    </Styles.Container>
  );
};

const Styles = {
  Container: styled.div<{ disabled?: boolean }>`
    background-color: ${(props) =>
      props.theme.mode === "light"
        ? ColorPalette.white
        : ColorPalette["gray-650"]};
    padding: 0.875rem 1rem;
    border-radius: 0.375rem;
    cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
    box-shadow: ${(props) =>
      props.theme.mode === "light"
        ? "0px 1px 4px 0px rgba(43, 39, 55, 0.10)"
        : "none"};
    position: relative;
    &:hover {
      background-color: ${(props) =>
        props.theme.mode === "light"
          ? ColorPalette["gray-10"]
          : ColorPalette["gray-600"]};
    }
  `,
  ChainImageWrapper: styled.div`
    position: relative;
    width: 2rem;
    height: 2rem;
  `,
  ExpandIcon: styled.div<{ isOpen: boolean }>`
    transition: transform 0.2s ease-in-out;
    transform: ${(props) => (props.isOpen ? "rotate(0deg)" : "rotate(180deg)")};
    height: 1rem;
    margin-left: 0.125rem;
  `,
};
