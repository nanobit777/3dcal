from django import template
from core.utils import clp_format

register = template.Library()

@register.filter
def clp(value):
    return clp_format(value)
