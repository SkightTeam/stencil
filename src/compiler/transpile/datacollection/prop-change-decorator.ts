import { ComponentMeta, PropChangeMeta } from '../../../util/interfaces';
import { PROP_CHANGE } from '../../../util/constants';
import { getDeclarationParameters, isMethodWithDecorators } from './utils';
import * as ts from 'typescript';

export function getPropChangeDecoratorMeta(node: ts.ClassDeclaration): ComponentMeta {
  if (!Array.isArray(node.members)) {
    return {};
  }

  return node.members
    .filter(isMethodWithDecorators)
    .reduce((membersMeta, member) => {
      const propChangeDecorator = member.decorators.find(dec => {
        return (ts.isCallExpression(dec.expression) &&
          ['PropWillChange', 'PropDidChange'].indexOf(dec.expression.expression.getText()) !== -1);
      });
      if (propChangeDecorator == null) {
        return membersMeta;
      }

      const [watchedName] = getDeclarationParameters(propChangeDecorator);

      if (ts.isCallExpression(propChangeDecorator.expression) && propChangeDecorator && watchedName) {
        const decoratorName = propChangeDecorator.expression.expression.getText();
        let metaObj: PropChangeMeta[];

        if (decoratorName === 'PropWillChange') {
          metaObj = membersMeta.propsWillChangeMeta = membersMeta.propsWillChangeMeta || [];
        } else if (decoratorName === 'PropDidChange') {
          metaObj = membersMeta.propsDidChangeMeta = membersMeta.propsDidChangeMeta || [];
        }

        metaObj.push({
          [PROP_CHANGE.PropName]: watchedName,
          [PROP_CHANGE.MethodName]: member.name.getText(),
        });
      }

      return membersMeta;
    }, {} as ComponentMeta);
}
